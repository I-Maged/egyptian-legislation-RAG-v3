import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname } from "path";

export interface WriteJsonFileOptions {
  pretty?: boolean;
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const json = await readFile(filePath, "utf8");

  return JSON.parse(json) as T;
}

export async function writeJsonFile(
  filePath: string,
  value: unknown,
  options: WriteJsonFileOptions = {},
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });

  const json = JSON.stringify(
    value,
    null,
    options.pretty === false ? 0 : 2,
  );

  await writeFile(filePath, `${json}\n`, "utf8");
}