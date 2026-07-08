using System.Collections.Generic;
using System.Linq;

namespace FoodFestAPI.Helpers
{
    // Turns the OpenAI:Models (comma-separated, ordered) config into a priority
    // list. Falls back to the single OpenAI:Model, then to a hardcoded default,
    // so the app always has at least one model to try.
    public static class ModelListParser
    {
        private const string DefaultModel = "gpt-4o-mini";

        public static List<string> Parse(string models, string singleModel)
        {
            if (!string.IsNullOrWhiteSpace(models))
            {
                var list = models
                    .Split(',')
                    .Select(m => m.Trim())
                    .Where(m => m.Length > 0)
                    .ToList();
                if (list.Count > 0)
                    return list;
            }

            if (!string.IsNullOrWhiteSpace(singleModel))
                return new List<string> { singleModel.Trim() };

            return new List<string> { DefaultModel };
        }
    }
}
