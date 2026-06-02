import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Keyboard } from "react-native";
import Icon from "../../components/ui/Icon";
import { colors, fonts } from "../../theme";

export default function ChatListHeader({ searchQuery, onSearchChange }) {
  const showSearch = searchQuery !== null;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        {showSearch ? (
          <View style={s.searchRow}>
            <View style={s.searchBox}>
              <Icon name="search" size={16} color={colors.ink300} />
              <TextInput
                style={s.searchInput}
                placeholder="Rechercher..."
                placeholderTextColor={colors.ink300}
                value={searchQuery}
                onChangeText={onSearchChange}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange("")} activeOpacity={0.7}>
                  <Icon name="close-circle" size={16} color={colors.ink300} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => onSearchChange(null)} activeOpacity={0.7} style={s.cancelBtn}>
              <Text style={s.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.titleRow}>
            <Text style={s.title}>Messages</Text>
            <TouchableOpacity onPress={() => onSearchChange("")} activeOpacity={0.7} style={s.searchBtn}>
              <Icon name="search" size={20} color={colors.ink700} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.ink900, letterSpacing: -0.5 },
  searchBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.ink50,
    alignItems: "center", justifyContent: "center",
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.ink50, borderRadius: 12,
    paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: fonts.regular, color: colors.ink900 },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { fontSize: 14, color: colors.primary, fontFamily: fonts.semiBold },
});
