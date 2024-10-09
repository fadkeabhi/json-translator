function removeKeys(fromDict: any, toDict: any): any {
    if (Array.isArray(fromDict) && Array.isArray(toDict)) {
      return fromDict.map((item, index) => {
        if (index < toDict.length && typeof item === 'object' && item !== null) {
          return removeKeys(item, toDict[index]);
        }
        return item;
      });
    }
  
    if (typeof fromDict !== 'object' || fromDict === null) {
      return fromDict;
    }
  
    const sampleIncompleteTranslations = ["", "--"];
    return Object.keys(fromDict).reduce((result: any, key) => {
      if (Array.isArray(fromDict[key])) {
        result[key] = removeKeys(fromDict[key], toDict?.[key] || []);
      } else if (typeof fromDict[key] === 'object' && fromDict[key] !== null && typeof toDict?.[key] === 'object' && toDict[key] !== null) {
        result[key] = removeKeys(fromDict[key], toDict[key]);
      } else if (!(key in toDict) || sampleIncompleteTranslations.includes(toDict[key]) || toDict[key] === fromDict[key]) {
        result[key] = fromDict[key];
      }
      return result;
    }, {});
  }
  
  const fromDict = { arr: [{ a: 1 }], a: 1, b: 2, c: 3, d: 4, inline: { a: 1, b: 2, c: 3, d: 4 } };
  const toDict = { arr: [{ a: 1 }, { b: 2 }], b: 2, d: "", inline: { b: "--", d: 4 } };
  
  const result = removeKeys(fromDict, toDict);
  console.log(result);