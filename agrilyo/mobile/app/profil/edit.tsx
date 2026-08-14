/**
 * Écran Édition du profil — /profil/edit
 */

import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize, Spacing, BorderRadius, CI_REGIONS } from "../../constants/theme";
import { authApi } from "../../api/auth.api";
import { getApiErrorMessage } from "../../api/client";
import { useAuthStore } from "../../store/auth.store";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

export default function EditProfilScreen() {
  const { user, updateUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [region, setRegion] = useState(user?.region ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUri, setAvatarUri] = useState<string | null>(null); // nouvelle photo choisie (pas encore uploadée)
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!user) return null;

  const handleChoisirPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Autorisation requise",
        "Autorisez l'accès à vos photos pour changer votre avatar."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleEnregistrer = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Champs requis", "Le prénom et le nom sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      // 1. Upload de la nouvelle photo si l'utilisateur en a choisi une
      if (avatarUri) {
        setUploadingAvatar(true);
        const updatedAfterAvatar = await authApi.uploadAvatar(avatarUri);
        updateUser(updatedAfterAvatar);
        setUploadingAvatar(false);
      }

      // 2. Mise à jour des champs texte
      const updated = await authApi.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: displayName.trim() || undefined,
        region: region || undefined,
        bio: bio.trim() || undefined,
      });
      updateUser(updated);

      router.back();
    } catch (err) {
      Alert.alert("Erreur", getApiErrorMessage(err));
    } finally {
      setSaving(false);
      setUploadingAvatar(false);
    }
  };

  const displayedAvatar = avatarUri || user.avatar_url;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.blanc} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier le profil</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleChoisirPhoto}>
            {displayedAvatar ? (
              <Image source={{ uri: displayedAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={36} color={Colors.blanc} />
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? (
                <Ionicons name="hourglass-outline" size={14} color={Colors.blanc} />
              ) : (
                <Ionicons name="camera" size={14} color={Colors.blanc} />
              )}
            </View>
          </TouchableOpacity>

          <Input label="Prénom" value={firstName} onChangeText={setFirstName} />
          <Input label="Nom" value={lastName} onChangeText={setLastName} />
          <Input
            label="Nom d'affichage (optionnel)"
            placeholder="Ex : Awa K."
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.label}>Région</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
            <View style={styles.pillRow}>
              {CI_REGIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.pill, region === r && styles.pillActif]}
                  onPress={() => setRegion(r)}
                >
                  <Text style={[styles.pillText, region === r && styles.pillTextActif]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Input
            label="Bio (optionnel)"
            placeholder="Parlez un peu de vous..."
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            inputStyle={styles.textArea}
            textAlignVertical="top"
          />

          <Button label="Enregistrer" onPress={handleEnregistrer} loading={saving} icon="checkmark" />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.cremeIvoire },
  header: {
    backgroundColor: Colors.vertForet,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, color: Colors.blanc },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
  avatarWrapper: { alignSelf: "center", marginBottom: Spacing.xl },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.vertForet,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.vertSavane,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.cremeIvoire,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.textPrincipal,
    marginBottom: Spacing.sm,
  },
  regionScroll: { marginBottom: Spacing.md },
  pillRow: { flexDirection: "row", gap: Spacing.sm },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.blanc,
    borderWidth: 1.5,
    borderColor: Colors.grisMoyen,
  },
  pillActif: { backgroundColor: Colors.vertForet, borderColor: Colors.vertForet },
  pillText: { fontFamily: FontFamily.bodyMedium, fontSize: FontSize.sm, color: Colors.textSecondaire },
  pillTextActif: { color: Colors.blanc },
  textArea: { height: 100, paddingTop: 14 },
});