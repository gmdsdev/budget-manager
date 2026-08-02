import { useTranslate } from "@budget-manager/i18n/react";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
  useFonts,
} from "@expo-google-fonts/jetbrains-mono";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Toaster } from "@/components/toaster";
import { authClient } from "@/lib/auth-client";
import { AppI18nProvider } from "@/lib/i18n";
import { ThemeProvider, useColors, useTheme } from "@/theme/theme-provider";
import { FONTS } from "@/theme/tokens";
import { queryClient } from "@/utils/trpc";

export default function RootLayout() {
  // One mono face everywhere — `JetBrains Mono` is both the body and the heading
  // face, so nothing renders until it is in hand.
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppI18nProvider>
            {fontsLoaded ? <AuthGate /> : <Splash />}
            <Toaster />
            <ThemedStatusBar />
          </AppI18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

/**
 * The native reading of the web's `_auth` layout route: the signed-out user is
 * sent to `/login` and the signed-in one is kept out of it. Redirecting in an
 * effect rather than during render, because the navigator has to be mounted
 * before it can be told where to go.
 */
function AuthGate() {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  const onLogin = segments[0] === "login";

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session && !onLogin) {
      router.replace("/login");
    }

    if (session && onLogin) {
      router.replace("/");
    }
  }, [session, isPending, onLogin, router]);

  if (isPending) {
    return <Splash />;
  }

  return <AppStack />;
}

/**
 * The tabs and the login screen own their whole surface; the three screens pushed from
 * **More** keep a native header, because a pushed screen needs a back affordance the
 * system already knows how to draw.
 */
function AppStack() {
  const t = useTranslate();
  const colors = useColors();

  const pushedOptions = {
    headerShown: true,
    // Without this the back button reads `(tabs)`: the label falls back to the
    // previous route's title, and the previous route is the tab group, whose
    // `Stack.Screen` has no title to give. All three of these are pushed from
    // **More**, so that is where back goes and what it should say.
    headerBackTitle: t("common.menu"),
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.foreground,
    headerTitleStyle: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      letterSpacing: 0.8,
    },
    headerBackTitleStyle: {
      fontFamily: FONTS.regular,
      fontSize: 14,
    },
  };

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen
        name="credit-card"
        options={{ ...pushedOptions, title: t("nav.creditCards").toUpperCase() }}
      />
      <Stack.Screen
        name="category"
        options={{ ...pushedOptions, title: t("nav.categories").toUpperCase() }}
      />
      <Stack.Screen
        name="settings"
        options={{ ...pushedOptions, title: t("nav.settings").toUpperCase() }}
      />
    </Stack>
  );
}

function Splash() {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator color={colors.foreground} />
    </View>
  );
}

function ThemedStatusBar() {
  const { mode } = useTheme();

  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}
