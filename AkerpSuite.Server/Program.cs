using AkerpSuite.Server.Data;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Middleware;
using AkerpSuite.Server.Repositories;
using AkerpSuite.Server.Services;
using Hangfire;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
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


// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "AkerpSuite API",
        Version = "v1"
    });

    // JWT Authentication in Swagger
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
builder.Services.AddScoped<FileUploadHelper>();
builder.Services.AddScoped<IAuthRepository, AuthRepositories>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminRepositories, AdminRepositories>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IHRRepository, HRRepository>();
builder.Services.AddScoped<IHRService, HRService>();
builder.Services.AddScoped<IPermissionRepository, PermissionRepository>();
builder.Services.AddSingleton<JwtHelper>();

// 🔔 Email Service (probation/anniversary reminders, etc.)
builder.Services.AddScoped<IEmailService, EmailService>();

// 🔔 Hangfire — background job scheduler (free/open-source)
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
    options.AddPolicy("AdminOnly",
        policy => policy.RequireRole("Admin"));

    options.AddPolicy("HROnly",
        policy => policy.RequireRole("HR"));

    options.AddPolicy("Management",
        policy => policy.RequireRole("CMD", "Admin", "Manager"));
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
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.UseHangfireDashboard("/hangfire");
app.MapControllers();

// 🔔 Recurring Job: roz subah 9:00 baje probation-completion emails HR ko bhejega
RecurringJob.AddOrUpdate<IHRService>(
    "probation-completion-reminder",
    service => service.SendProbationCompletionRemindersAsync(),
    Cron.Daily(9, 0));
app.MapFallbackToFile("index.html");

app.Run();