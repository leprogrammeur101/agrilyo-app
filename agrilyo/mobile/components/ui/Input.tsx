/**
 * Input — composant UI de base AGRILYO.
 * Label optionnel, message d'erreur, icône gauche, toggle mot de passe.
 */

import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { BorderRadius, FontFamily, FontSize, Spacing } from "../../constants/theme";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  containerStyle?: object;
  inputStyle?: object;
}

export default function Input({
  label,
  error,
  icon,
  containerStyle,
  inputStyle,
  secureTextEntry,
  ...textInputProps
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = secureTextEntry === true;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputWrapperError : null,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={Colors.textSecondaire}
            style={styles.iconLeft}
          />
        )}

        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={Colors.textDesactive}
          secureTextEntry={isPasswordField && !isPasswordVisible}
          {...textInputProps}
        />

        {isPasswordField && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible((prev) => !prev)}
            hitSlop={10}
            style={styles.eyeButton}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={Colors.textSecondaire}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    marginBottom: Spacing.xs + 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.blanc,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
    paddingHorizontal: Spacing.md,
  },
  inputWrapperError: {
    borderColor: Colors.erreur,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  eyeButton: {
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.md,
    color: Colors.textPrincipal,
  },
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.erreur,
    marginTop: Spacing.xs,
  },
});