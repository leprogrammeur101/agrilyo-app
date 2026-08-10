/**
 * Button — composant UI de base AGRILYO.
 * Variants : primary (plein, vert forêt) · secondary (plein, vert savane)
 *            outline (bordure, transparent) · ghost (texte seul)
 */

import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Spacing } from "../../constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const SIZE_STYLES: Record<ButtonSize, { paddingVertical: number; fontSize: number; iconSize: number }> = {
  sm: { paddingVertical: 10, fontSize: FontSize.sm, iconSize: 16 },
  md: { paddingVertical: 15, fontSize: FontSize.md, iconSize: 18 },
  lg: { paddingVertical: 18, fontSize: FontSize.lg, iconSize: 20 },
};

export default function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconPosition = "left",
  fullWidth = true,
  ...touchableProps
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeStyle = SIZE_STYLES[size];
  const textColor = variant === "outline" || variant === "ghost" ? Colors.vertForet : Colors.blanc;

  const content: ReactNode = loading ? (
    <ActivityIndicator color={textColor} />
  ) : (
    <View style={styles.content}>
      {icon && iconPosition === "left" && (
        <Ionicons name={icon} size={sizeStyle.iconSize} color={textColor} style={styles.iconLeft} />
      )}
      <Text
        style={[
          styles.label,
          { color: textColor, fontSize: sizeStyle.fontSize },
        ]}
      >
        {label}
      </Text>
      {icon && iconPosition === "right" && (
        <Ionicons name={icon} size={sizeStyle.iconSize} color={textColor} style={styles.iconRight} />
      )}
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={isDisabled}
      {...touchableProps}
      style={[
        styles.base,
        styles[variant],
        { paddingVertical: sizeStyle.paddingVertical },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FontFamily.headingSemiBold,
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  primary: {
    backgroundColor: Colors.vertForet,
  },
  secondary: {
    backgroundColor: Colors.vertSavane,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.vertForet,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.5,
  },
});
