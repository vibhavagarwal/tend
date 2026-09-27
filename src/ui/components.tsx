import { PropsWithChildren, ReactNode, useState } from "react";
import { Image, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { font, spacing, type } from "./theme";

export type Colors = ReturnType<typeof import("./theme").palette>;

export function TendMark() {
  return (
    <View accessibilityLabel="Tend app icon" style={styles.mark}>
      <Svg width={40} height={40} viewBox="0 0 108 108">
        <Path fill="#006B5F" d="M0 0h108v108H0z" />
        <Path fill="#fff" d="M50 79h8V49h-8zm4-29C37 50 27 40 27 23c17 0 27 10 27 27zm0 12c0-17 10-27 27-27 0 17-10 27-27 27z" />
      </Svg>
    </View>
  );
}

export function Wordmark({ subdued = false, colors }: { subdued?: boolean; colors: Colors }) {
  return (
    <Image
      accessibilityLabel="Tend"
      resizeMode="contain"
      source={require("../../assets/tend-wordmark.png")}
      style={[
        styles.wordmark,
        {
          opacity: subdued ? 0.34 : 1,
          tintColor: colors.dark ? colors.primaryText : undefined,
        },
      ]}
    />
  );
}

type ActionProps = {
  children: ReactNode;
  onPress: () => void;
  colors: Colors;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "tertiary" | "retreat";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Action({ children, onPress, colors, disabled = false, variant = "primary", accessibilityLabel, style }: ActionProps) {
  const primary = variant === "primary";
  const secondary = variant === "secondary";
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        primary && { minHeight: 60, backgroundColor: colors.quietAccent },
        secondary && { minHeight: 44, borderColor: colors.quietAccent, borderWidth: 1 },
        !primary && !secondary && { minHeight: 44 },
        focused && { borderColor: colors.primaryText, borderWidth: 2 },
        pressed && { opacity: 0.72 },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      <Text style={[
        primary ? type.button : type.tertiary,
        { color: primary ? colors.accentInk : variant === "retreat" ? colors.mutedText : colors.quietAccent, textAlign: "center" },
      ]}>{children}</Text>
    </Pressable>
  );
}

export function SectionLabel({ children, colors }: PropsWithChildren<{ colors: Colors }>) {
  return <Text style={[type.section, { color: colors.mutedText, textAlign: "center" }]}>{children}</Text>;
}

export function InlineSection({ children, colors }: PropsWithChildren<{ colors: Colors }>) {
  return <View style={[styles.inlineSection, { borderColor: colors.hairline }]}>{children}</View>;
}

export function Rule({ colors }: { colors: Colors }) {
  return <View style={[styles.rule, { backgroundColor: colors.hairline }]} />;
}

export function TextBlock({ children, colors, style }: PropsWithChildren<{ colors: Colors; style?: StyleProp<TextStyle> }>) {
  return <Text style={[type.body, { color: colors.primaryText }, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  mark: { width: 40, height: 40, borderRadius: 11, overflow: "hidden" },
  wordmark: { width: 200, height: 58, marginTop: 14 },
  action: { alignItems: "center", justifyContent: "center", borderRadius: 999, paddingHorizontal: 22 },
  inlineSection: { width: "100%", borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.sm },
  rule: { width: 56, height: 1, alignSelf: "center", marginVertical: spacing.md },
});
