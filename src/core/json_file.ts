import { translatedObject } from '..';
import { error, messages, success } from '../utils/console';
import { getFile, getRootFolder, saveFilePublic } from './core';
import { objectTranslator } from './json_object';
import { matchYamlExt } from '../utils/yaml';
import { TranslationConfig } from '../modules/modules';
import { getLanguageKeyFromValue } from '../modules/helpers';

export async function fileTranslator(
  TranslationConfig: TranslationConfig,
  tempObjectPath: string,
  from: string,
  to: string[],
  newFileName: string
) {
  // step: get file details -> data, path
  const file: { jsonObj: any; objectPath: string } = await getFileFromPath(tempObjectPath);
  const rawjsonObj = file.jsonObj
  const objectPath = file.objectPath
  if (rawjsonObj === undefined) {
    error(messages.file.no_file_in_path);
    return;
  }

  // if file extension is .jsonl convert the readed file to json with array of each line of the json file
  const jsonObj = objectPath.endsWith('.jsonl')
    ? { data: rawjsonObj.split('\n').map((line: string) => JSON.parse(line)) }
    : { data: JSON.parse(rawjsonObj) };

  // step: check if translation file already exists, if exists save content of it in oldTranslations
  let oldTranslations = JSON.parse("{}")
  let latestPath = objectPath.replace(/\\/g, '/');
  const fileExt = getFileExt(latestPath);
  let rootFolder = getRootFolder(latestPath);

  for (const lang of to) {
    // Filename of tranlated file
    let fileName = newFileName
      ? `.\\${newFileName}.${lang}.${fileExt}`
      : `.\\${lang}.${fileExt}`;

    let response = await getFileFromPath(fileName);
    let oldTranslation = response?.jsonObj
    try {
      if (oldTranslation === undefined) {
        // Old Translation not found
        oldTranslations[lang] = { data: {} };
      } else {
        oldTranslation = { data: JSON.parse(oldTranslation) };
        oldTranslations[lang] = oldTranslation;
      }
    } catch {
      // If error in parsing json skip it
      oldTranslations[lang] = { data: {} };
    }

  }

  // if jsonl file force to translate all keys
  const forceTranslateOldTranslations = objectPath.endsWith('.jsonl');

  // step: translate object
  let newJsonObj = await objectTranslator(TranslationConfig, jsonObj, from, to, oldTranslations, forceTranslateOldTranslations);
  if (newJsonObj === undefined) {
    error(messages.file.cannot_translate);
    return;
  }

  console.log(JSON.stringify(newJsonObj, null, 2));
  console.log(newJsonObj);


  // step: save translated data
  (newJsonObj as Array<translatedObject>).forEach(async (element, index) => {
    const currentJsonObj = element.data;

    let fileName = newFileName
      ? `/${newFileName}.${to[index]}.${fileExt}`
      : `/${to[index]}.${fileExt}`;

    await saveFilePublic(rootFolder + fileName, currentJsonObj);

    success(
      `For ${getLanguageKeyFromValue(
        to[index],
        TranslationConfig.TranslationModule.languages
      )} --> ${fileName} created.`
    );
  });
}

export async function getFileFromPath(
  objectPath: string
): Promise<{ jsonObj: any; objectPath: string }> {
  let jsonObj: any = await getFile(objectPath);

  if (jsonObj === undefined) {
    objectPath = __dirname + '\\' + objectPath;

    jsonObj = await getFile(objectPath);
  }

  return { jsonObj, objectPath };
}

function getFileExt(latestPath: string): string {
  // Check if source file has YAML extension and return the extension ("yml" or "yaml").
  const sourceFileMatchYamlExt = matchYamlExt(latestPath);

  let fileExt = "";
  if (latestPath.endsWith('.jsonl')) {
    // If the latestPath file extension is jsonl, keep fileExt jsonl
    fileExt = "jsonl";
  } else {
    // When source file has "yml" or "yaml" extension, use the same in output file path.
    // Otherwise, default "json" extension used.
    fileExt = sourceFileMatchYamlExt || 'json';
  }

  return fileExt;
}
