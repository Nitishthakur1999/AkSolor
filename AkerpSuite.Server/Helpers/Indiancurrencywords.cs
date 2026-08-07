namespace AkerpSuite.Server.Helpers
{
    public static class IndianCurrencyWords
    {
        private static readonly string[] Ones =
        {
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"
        };

        private static readonly string[] Tens =
        {
            "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        };

        public static string Convert(long amount)
        {
            if (amount == 0) return "Zero";
            if (amount < 0) return "Minus " + Convert(-amount);

            var parts = new List<string>();

            var crore = amount / 1_00_00_000;
            amount %= 1_00_00_000;
            var lakh = amount / 1_00_000;
            amount %= 1_00_000;
            var thousand = amount / 1_000;
            amount %= 1_000;
            var hundred = amount / 100;
            var remainder = amount % 100;

            if (crore > 0) parts.Add(TwoDigitGroup(crore) + " Crore");
            if (lakh > 0) parts.Add(TwoDigitGroup(lakh) + " Lakh");
            if (thousand > 0) parts.Add(TwoDigitGroup(thousand) + " Thousand");
            if (hundred > 0) parts.Add(Ones[hundred] + " Hundred");
            if (remainder > 0) parts.Add(TwoDigitGroup(remainder));

            return string.Join(" ", parts);
        }

        // Converts a 1–99 value (crore/lakh/thousand can still exceed 99 as a
        // *group count*, e.g. 32 thousand -> group value is 32, always < 100).
        private static string TwoDigitGroup(long n)
        {
            if (n < 20) return Ones[n];
            return (Tens[n / 10] + " " + Ones[n % 10]).Trim();
        }
    }
}