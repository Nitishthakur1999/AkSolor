using AkerpSuite.Server.DTOs.Role;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace AkerpSuite.Server.Reports
{
    public static class SundayHolidayStatusPdfBuilder
    {
        public static byte[] Build(SundayHolidayStatusReportDto report)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(25);
                    page.DefaultTextStyle(x => x.FontSize(9));

                    // ---------- Header ----------
                    page.Header().Column(col =>
                    {
                        col.Item().AlignCenter().Text(report.CompanyName)
                            .FontSize(14).Bold();
                        col.Item().AlignCenter().Text($"HR-SUNDAY/HOLIDAY WORKING STATUS - {report.MonthName}")
                            .FontSize(11).Bold();
                        col.Item().PaddingTop(8);
                    });

                    // ---------- Table ----------
                    page.Content().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.ConstantColumn(30);   // Sr No
                            cols.RelativeColumn(2.5f); // Name
                            foreach (var _ in report.SundayDates)
                                cols.RelativeColumn(1.3f);
                            cols.RelativeColumn(1f);   // Duty
                            cols.RelativeColumn(1f);   // Comp Off
                            cols.RelativeColumn(1f);   // Prev Balance
                            cols.RelativeColumn(1f);   // Final Dues
                        });

                        table.Header(header =>
                        {
                            HeaderCell(header, "SR.\nNO.");
                            HeaderCell(header, "Employee Name");
                            foreach (var date in report.SundayDates)
                                HeaderCell(header, $"SUNDAY-{date.Day}");
                            HeaderCell(header, $"{report.MonthName.Split(' ')[0]} SUNDAY DUTY");
                            HeaderCell(header, $"{report.MonthName.Split(' ')[0]} COM. OFF");
                            HeaderCell(header, "PREV. BALANCE");
                            HeaderCell(header, "FINAL DUES");
                        });

                        foreach (var row in report.Rows)
                        {
                            BodyCell(table, row.SrNo.ToString(), alignCenter: true);
                            BodyCell(table, row.EmployeeName);
                            foreach (var cell in row.Cells)
                                BodyCell(table, cell.Status, alignCenter: true);
                            BodyCell(table, row.MonthDutyCount.ToString("0.##"), alignCenter: true);
                            BodyCell(table, row.MonthCompOff.ToString("0.##"), alignCenter: true);
                            BodyCell(table, row.PreviousBalance.ToString("0.##"), alignCenter: true);
                            BodyCell(table, row.FinalDues.ToString("0.##"), alignCenter: true, bold: true);
                        }
                    });

                    // ---------- Signature footer ----------
                    page.Footer().PaddingTop(20).Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("PREPARED BY:").Bold();
                            c.Item().PaddingTop(15).Text(report.PreparedByName);
                            c.Item().Text(report.PreparedByDesignation).FontSize(8);
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("VERIFIED BY:").Bold();
                            c.Item().PaddingTop(15).Text(report.VerifiedByName);
                            c.Item().Text(report.VerifiedByDesignation).FontSize(8);
                        });
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("FINAL VERIFICATION:").Bold();
                            c.Item().PaddingTop(15).Text(report.FinalVerifiedByName);
                            c.Item().Text(report.FinalVerifiedByDesignation).FontSize(8);
                        });
                    });
                });
            });

            return doc.GeneratePdf();
        }

        private static void HeaderCell(TableCellDescriptor header, string text)
        {
            header.Cell().Element(CellStyle).Text(text).Bold().FontSize(8);
            static IContainer CellStyle(IContainer c) => c
                .Background(Colors.Grey.Lighten2)
                .Border(0.5f).BorderColor(Colors.Grey.Medium)
                .Padding(3).AlignCenter().AlignMiddle();
        }

        private static void BodyCell(TableDescriptor table, string text, bool alignCenter = false, bool bold = false)
        {
            var container = table.Cell().Element(c =>
            {
                var cell = c.Border(0.5f).BorderColor(Colors.Grey.Lighten1).Padding(3);
                return alignCenter ? cell.AlignCenter() : cell;
            });

            if (bold)
                container.Text(text).Bold();
            else
                container.Text(text);
        }
    }
}