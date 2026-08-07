using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace AkerpSuite.Server.Services
{
    // Fills {{Token}} placeholders inside a .docx template with real values,
    // producing a fully editable Word document (not a PDF, not flattened text).
    //
    // NuGet dependency: DocumentFormat.OpenXml
    //
    // Used by AdminService.GenerateOfferLetterAsync / GenerateAppointmentLetterAsync
    // against Templates/Offer_Letter_Template.docx and Templates/Appointment_Letter_Template.docx.
    public class DocxTemplateMergeService
    {
        public byte[] Merge(string templatePath, Dictionary<string, string> fields)
        {
            using var ms = new MemoryStream();
            using (var fs = File.OpenRead(templatePath))
                fs.CopyTo(ms);
            ms.Position = 0;

            using (var doc = WordprocessingDocument.Open(ms, true))
            {
                var body = doc.MainDocumentPart.Document.Body;

                // If the template is ever re-saved from Word, a placeholder can get
                // re-split across multiple runs. Merge adjacent same-formatted runs
                // first so {{Token}} always reads back as one contiguous string
                // before we try to replace it.
                MergeAdjacentRuns(body);

                foreach (var text in body.Descendants<Text>())
                {
                    if (string.IsNullOrEmpty(text.Text) || !text.Text.Contains("{{"))
                        continue;

                    foreach (var kv in fields)
                    {
                        var token = "{{" + kv.Key + "}}";
                        if (text.Text.Contains(token))
                            text.Text = text.Text.Replace(token, kv.Value ?? "");
                    }
                }

                doc.MainDocumentPart.Document.Save();
            }

            return ms.ToArray();
        }

        private void MergeAdjacentRuns(OpenXmlElement root)
        {
            foreach (var para in root.Descendants<Paragraph>().ToList())
            {
                var runs = para.Elements<Run>().ToList();
                for (int i = 0; i < runs.Count - 1; i++)
                {
                    var a = runs[i];
                    var b = runs[i + 1];

                    var aTexts = a.Elements<Text>().ToList();
                    var bTexts = b.Elements<Text>().ToList();

                    var sameFormatting = (a.RunProperties?.OuterXml ?? "") == (b.RunProperties?.OuterXml ?? "");
                    var bothPlainText = aTexts.Count == 1 && bTexts.Count == 1
                        && a.ChildElements.Count == (a.RunProperties != null ? 2 : 1)
                        && b.ChildElements.Count == (b.RunProperties != null ? 2 : 1);

                    if (sameFormatting && bothPlainText)
                    {
                        aTexts[0].Text += bTexts[0].Text;
                        b.Remove();
                        runs.Remove(b);
                        i--;
                    }
                }
            }
        }
    }
}