import { ColorSchemeName, TextStyle, ViewStyle } from "react-native";

export const spacing = { xs: 6, sm: 12, compact: 14, md: 22, lg: 26, xl: 34, display: 52 } as const;

export const palette = (scheme: ColorSchemeName) => {
  const dark = scheme === "dark";
  return {
    dark,
    background: dark ? "#0E1514" : "#EBEFEE",
    surface: dark ? "#16201E" : "#F9FBFA",
    primaryText: dark ? "#E2EBE8" : "#17211F",
    mutedText: dark ? "#90A39F" : "#5A6B68",
    quietAccent: dark ? "#6FBFB2" : "#006B5F",
    accentInk: dark ? "#0E1514" : "#F9FBFA",
    hairline: dark ? "#26302E" : "#D7DFDC",
    emphasis: dark ? "#3A4A47" : "#A9BCB6",
    error: dark ? "#FFB4A9" : "#8A1C13",
  };
};

export const font = {
  expressive: "EBGaramond",
  expressiveItalic: "EBGaramondItalic",
  functional: "Karla",
  caption: "IBMPlexMono",
} as const;

export const type = {
  heading: { fontFamily: font.expressive, fontSize: 34, lineHeight: 39 } satisfies TextStyle,
  prompt: { fontFamily: font.expressive, fontSize: 31, lineHeight: 40 } satisfies TextStyle,
  transcript: { fontFamily: font.expressiveItalic, fontSize: 28, lineHeight: 39 } satisfies TextStyle,
  title: { fontFamily: font.expressive, fontSize: 26, lineHeight: 32 } satisfies TextStyle,
  field: { fontFamily: font.functional, fontSize: 19, lineHeight: 25 } satisfies TextStyle,
  list: { fontFamily: font.functional, fontSize: 17, lineHeight: 23 } satisfies TextStyle,
  body: { fontFamily: font.functional, fontSize: 16, lineHeight: 22 } satisfies TextStyle,
  button: { fontFamily: font.functional, fontSize: 17, lineHeight: 22 } satisfies TextStyle,
  tertiary: { fontFamily: font.functional, fontSize: 15, lineHeight: 20 } satisfies TextStyle,
  metadata: { fontFamily: font.caption, fontSize: 12, lineHeight: 17 } satisfies TextStyle,
  section: { fontFamily: font.caption, fontSize: 11, lineHeight: 16, letterSpacing: 1.54, textTransform: "uppercase" } satisfies TextStyle,
};

export const focusStyle: ViewStyle = { borderWidth: 2 };
