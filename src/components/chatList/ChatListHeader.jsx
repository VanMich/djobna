import React, { useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export default function ChatListHeader({ searchQuery, onSearchChange }) {
  const showSearch = searchQuery !== null;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        {showSearch ? (
          <View style={s.searchRow}>
            <View style={s.searchBox}>
              <Ionicons name="search" size={16} color="#AAB0B7" />
              <TextInput
                style={s.searchInput}
                placeholder="Rechercher..."
                placeholderTextColor="#AAB0B7"
                value={searchQuery}
                onChangeText={onSearchChange}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => onSearchChange("")} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={16} color="#AAB0B7" />
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
              <Ionicons name="search" size={20} color={colors.textLight} />
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
  title: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  searchBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12,
    paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#fff" },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { fontSize: 14, color: colors.textLight, fontWeight: "600" },
});
