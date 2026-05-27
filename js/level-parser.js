/**
 * LevelParser converts JSON level data into the internal format
 * used by the ObstacleManager.
 */
export class LevelParser {
  static parse(jsonData) {
    if (!jsonData || !jsonData.objects) {
      console.warn('[LevelParser] Invalid JSON data format');
      return [];
    }

    // Sort objects by time to ensure sequential spawning
    const mapping = jsonData.objects.map(obj => ({
      ...obj,
      time: parseFloat(obj.time)
    })).sort((a, b) => a.time - b.time);

    return mapping;
  }

  /**
   * Helper to fetch a JSON file and parse it.
   */
  static async load(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return this.parse(data);
    } catch (e) {
      console.error(`[LevelParser] Failed to load level from ${url}:`, e);
      return [];
    }
  }
}
