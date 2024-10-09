import { translatedObject } from '..';
import { plaintranslate } from './translator';
import { TaskQueue } from 'cwait';
import { Promise as bluebirdPromise } from 'bluebird';
import { TranslationConfig } from '../modules/modules';
import { default_concurrency_limit } from '../utils/micro';

var queue = new TaskQueue(bluebirdPromise, default_concurrency_limit);

export async function objectTranslator(
  TranslationConfig: TranslationConfig,
  object: translatedObject,
  from: string,
  to: string[],
  oldTranslations: { [key: string]: any }
): Promise<translatedObject[]> {
  queue.concurrency = TranslationConfig.concurrencyLimit;

  if (object && from && to) {
    let generalObject: translatedObject[] | null[] = [];

    await Promise.all(
      Object.keys(to).map(async function (index) {
        const indexAsNum = Number(index);
        const copyObject = removeKeys(JSON.parse(JSON.stringify(object)), oldTranslations[to[indexAsNum]]);

        const newTranslations = await deepDiver(
          TranslationConfig,
          copyObject,
          from,
          to[indexAsNum]
        );

        // Insert removed old translations into the generalObject
        generalObject[indexAsNum] = mergeKeys(newTranslations, oldTranslations[to[indexAsNum]])
      })
    );

    console.log(generalObject)



    return generalObject as translatedObject[];
  } else {
    throw new Error(
      `Undefined values detected. Available ones: object: ${!!object}, from: ${!!from}, to: ${!!to}`
    );
  }
}

export async function deepDiver(
  TranslationConfig: TranslationConfig,
  object: translatedObject,
  from: string,
  to: string
): Promise<translatedObject | null> {
  var has = Object.prototype.hasOwnProperty.bind(object);

  if (object === null) {
    return null;
  }

  await Promise.all(
    Object.keys(object).map(async function (k) {
      if (has(k)) {
        switch (typeof object[k]) {
          case 'object':
            await deepDiver(TranslationConfig, object[k], from, to);
            break;
          case 'string':
            global.totalTranslation = global.totalTranslation + 1;

            return queue.add(async () => {
              return await plaintranslate(
                TranslationConfig,
                object[k],
                from,
                to,
                []
              )
                .then(data => {
                  object[k] = data;
                })
                .catch(err => {
                  // TODO: return error
                  console.log('Translation error:', err);
                });
            });
        }
      }
    })
  );

  return object;
}

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


function mergeKeys(base: any, insert: any): any {
  // If base is not an object or is null, return insert
  if (typeof base !== 'object' || base === null) {
    return insert;
  }

  // If insert is not an object or is null, return base
  if (typeof insert !== 'object' || insert === null) {
    return base;
  }

  // Handle arrays
  if (Array.isArray(base) && Array.isArray(insert)) {
    return [...base, ...insert.filter(item => !base.includes(item))];
  }

  // Handle objects
  const result = { ...base };

  for (const key in insert) {
    if (Object.prototype.hasOwnProperty.call(insert, key)) {
      if (key in result && typeof result[key] === 'object' && typeof insert[key] === 'object') {
        // Recursively merge nested objects or arrays
        result[key] = mergeKeys(result[key], insert[key]);
      } else if (!(key in result)) {
        // Add new key-value pair from insert if it doesn't exist in base
        result[key] = insert[key];
      }
      // If the key exists in both and is not an object, keep the base value
    }
  }

  return result;
}