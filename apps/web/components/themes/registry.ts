import { LightModeTheme } from "./LightModeTheme";
import { DarkModeTheme } from "./DarkModeTheme";
import { ShellModeTheme } from "./ShellModeTheme";

export const themeRegistry: Record<string, any> = {
  "lightMode": LightModeTheme,
  "darkMode": DarkModeTheme,
  "shellMode": ShellModeTheme,
};
