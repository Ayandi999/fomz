export const THEMES_STORE = [
  {
    id: "lightMode",
    name: "Light Mode (Default)",
    description: "A clean, minimalistic light theme with paper textures."
  },
  {
    id: "darkMode",
    name: "Dark Mode",
    description: "A sleek, dark interface tailored for low light environments."
  },
  {
    id: "shellMode",
    name: "Shell / Terminal",
    description: "A retro terminal-style interface for developers."
  }
];

export const getThemeByKey = (key: string) => {
  return THEMES_STORE.find(theme => theme.id === key) || THEMES_STORE[0];
};


