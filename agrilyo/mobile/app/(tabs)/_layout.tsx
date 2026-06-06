/**
 * Layout Tabs — Navigation principale AGRILYO
 * 4 onglets : Accueil · Foncier · Semences · Conseil
 */

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { FontFamily, FontSize } from "../../constants/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface TabConfig {
  name: string;
  title: string;
  icon: IoniconName;
  iconFocused: IoniconName;
  color: string;
}

const TABS: TabConfig[] = [
  {
    name: "index",
    title: "Accueil",
    icon: "home-outline",
    iconFocused: "home",
    color: Colors.vertForet,
  },
  {
    name: "foncier",
    title: "Foncier",
    icon: "map-outline",
    iconFocused: "map",
    color: Colors.foncier,
  },
  {
    name: "semences",
    title: "Semences",
    icon: "leaf-outline",
    iconFocused: "leaf",
    color: Colors.semences,
  },
  {
    name: "conseil",
    title: "Conseil",
    icon: "people-outline",
    iconFocused: "people",
    color: Colors.conseil,
  },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.vertForet,
        tabBarInactiveTintColor: Colors.grisFonce,
        tabBarStyle: {
          backgroundColor: Colors.blanc,
          borderTopWidth: 1,
          borderTopColor: Colors.grisMoyen,
          height: 72,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamily.bodyMedium,
          fontSize: FontSize.xs,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarActiveTintColor: tab.color,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}