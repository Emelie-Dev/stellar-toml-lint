import type { Rule } from "../types.js";
import { currencyRules } from "./currencies.js";
import { documentationRules } from "./documentation.js";
import { principalRules } from "./principals.js";
import { responseRules } from "./response.js";
import { topLevelRules } from "./toplevel.js";
import { validatorRules } from "./validators.js";

export const defaultRules: Rule[] = [
  ...responseRules,
  ...topLevelRules,
  ...currencyRules,
  ...documentationRules,
  ...principalRules,
  ...validatorRules,
];
