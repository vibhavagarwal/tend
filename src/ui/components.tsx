import { PropsWithChildren, ReactNode, useState } from "react";
import { Image, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { font, spacing, type } from "./theme";

export type Colors = ReturnType<typeof import("./theme").palette>;

export function NeevMark() {
  return (
    <Image
      accessibilityLabel="Neev mark"
      resizeMode="contain"
      source={require("../../assets/neev-icon.png")}
      style={styles.mark}
    />
  );
}

export function Wordmark({ subdued = false, colors }: { subdued?: boolean; colors: Colors }) {
  return (
    <Text accessibilityLabel="neev" style={[styles.wordmark, { color: colors.quietAccent, opacity: subdued ? 0.34 : 1 }]}>neev</Text>
  );
}

type IconActionProps = {
  accessibilityLabel: string;
  colors: Colors;
  icon: "archive" | "delete";
  onPress: () => void;
};

export function IconAction({ accessibilityLabel, colors, icon, onPress }: IconActionProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={6}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconAction,
        focused && { borderColor: colors.primaryText },
        pressed && { opacity: 0.72 },
      ]}
    >
      <Svg accessibilityElementsHidden width={20} height={20} viewBox="0 0 24 24">
        {icon === "delete" ? (
          <Path
            d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"
            fill="none"
            stroke={colors.mutedText}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
          />
        ) : (
          <Path
            d="M4 5h16v4H4V5Zm2 4v11h12V9m-8 4h4"
            fill="none"
            stroke={colors.mutedText}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
          />
        )}
      </Svg>
    </Pressable>
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
  wordmark: { alignSelf: "center", fontFamily: font.expressiveItalic, fontSize: 64, lineHeight: 74, marginTop: 16 },
  iconAction: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  action: { alignItems: "center", justifyContent: "center", borderRadius: 999, paddingHorizontal: 22 },
  inlineSection: { width: "100%", borderTopWidth: 1, paddingTop: spacing.md, gap: spacing.sm },
  rule: { width: 56, height: 1, alignSelf: "center", marginVertical: spacing.md },
});
