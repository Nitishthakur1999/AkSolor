using AkerpSuite.Server.Data;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Middleware;
using AkerpSuite.Server.Repositories;
using AkerpSuite.Server.Services;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IO.Compression;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddScoped<FileUploadHelper>();

// Response compression (Brotli + Gzip)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "image/svg+xml",
        "application/javascript",
        "text/javascript",
        "text/css",
        "application/json"
    });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AkerpSuite API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter JWT Token. Example: Bearer eyJhbGciOiJIUzI1NiIs...",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Dapper
builder.Services.AddScoped<DapperContext>();
builder.Services.AddScoped<IAuthRepository, AuthRepositories>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminRepositories, AdminRepositories>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IHRRepository, HRRepository>();
builder.Services.AddScoped<IHRService, HRService>();
builder.Services.AddScoped<IPermissionRepository, PermissionRepository>();
builder.Services.AddSingleton<JwtHelper>();

// Email Service
builder.Services.AddScoped<IEmailService, EmailService>();

// Hangfire
builder.Services.AddHangfire(config => config
    .UseStorage(new Hangfire.MySql.MySqlStorage(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        new Hangfire.MySql.MySqlStorageOptions
        {
            TablesPrefix = "Hangfire_"
        })));
builder.Services.AddHangfireServer();

// JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),

            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name
        };
    });

// Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("HROnly", policy => policy.RequireRole("HR"));
    options.AddPolicy("Management", policy => policy.RequireRole("CMD", "Admin", "Manager"));
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

var app = builder.Build();

// 1) Compression sabse pehle
app.UseResponseCompression();

// 2) HTTPS redirect
app.UseHttpsRedirection();

// 3) Static files EXCEPTION middleware se pehle, taaki index.html/assets fast serve ho
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var headers = ctx.Context.Response.Headers;

        if (ctx.File.Name.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            // no-cache = ETag se revalidate (304), no-store se better
            headers["Cache-Control"] = "no-cache";
        }
        else if (ctx.Context.Request.Path.StartsWithSegments("/assets"))
        {
            headers["Cache-Control"] = "public, max-age=31536000, immutable";
        }
        else
        {
            headers["Cache-Control"] = "public, max-age=86400";
        }
    }
});

// 4) Persistent uploads folder
var uploadsConfigPath = builder.Configuration["UploadsRootPath"];
if (!string.IsNullOrWhiteSpace(uploadsConfigPath))
{
    var uploadsPath = Path.IsPathRooted(uploadsConfigPath)
        ? uploadsConfigPath
        : Path.Combine(builder.Environment.ContentRootPath, uploadsConfigPath);

    if (!Directory.Exists(uploadsPath))
        Directory.CreateDirectory(uploadsPath);

    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadsPath),
        RequestPath = "",
        OnPrepareResponse = ctx =>
        {
            ctx.Context.Response.Headers["Cache-Control"] = "public, max-age=2592000";
        }
    });
}

// 5) Exception middleware + Swagger (sirf Development)
app.UseMiddleware<GlobalExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire");
app.MapControllers();

RecurringJob.AddOrUpdate<IHRService>(
    "probation-completion-reminder",
    service => service.SendProbationCompletionRemindersAsync(),
    Cron.Daily(9, 0));

RecurringJob.AddOrUpdate<IAuthService>(
    "cleanup-refresh-tokens",
    s => s.CleanupExpiredRefreshTokensAsync(),
    Cron.Daily(3, 0));

// SPA fallback
app.MapFallbackToFile("index.html", new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["Cache-Control"] = "no-cache";
    }
});

app.Run();