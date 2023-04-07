import * as fs from 'fs';
import { join } from 'path';

export function readApiDocs(nameFile: string) {
  return fs
    .readFileSync(join(__dirname, 'assets', 'docs', nameFile))
    .toString();
}
