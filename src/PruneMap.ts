/* A map that prunes keys that have not been touched */
class PruneMap<T> {
  private map: {
    [key: string]: T;
  } = {};
  private touched: string[] = [];

  /* Get item, mark it as touched */
  get = (key: string): T => {
    this.touched.push(key);
    return this.map[key];
  };

  /* Set item, mark it as touched */
  set = (key: string, value: T) => {
    this.touched.push(key);
    this.map[key] = value;
  };

  /* Reset tracking on keys */
  reset = () => {
    this.touched = [];
  };

  /* Prune all keys that have not been touched since last reset */
  /* Offers callback to do something with pruned values */
  prune = (callback?: (value: T) => void) => {
    Object.keys(this.map).forEach(key => {
      if (!this.touched.includes(key)) {
        callback && callback(this.map[key]);
        delete this.map[key];
      }
    });
  };
}

export default PruneMap;
