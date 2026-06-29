import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import rootConfig from "../../eslint.config.mjs";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default [
  ...rootConfig,
  {
    languageOptions: {
      parserOptions: { tsconfigRootDir },
    },
  },
];
