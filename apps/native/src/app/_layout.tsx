import { useTranslate } from "@budget-manager/i18n/react";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
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
  // Inter is both `--font-sans` and `--font-heading` on the web, so it is the one
  // face here too — and nothing renders until it is in hand.
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
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
 * The tabs and the login screen own their whole surface; the four screens pushed from
 * the account menu keep a native header, because a pushed screen needs a back
 * affordance the system already knows how to draw.
 */
function AppStack() {
  const t = useTranslate();
  const colors = useColors();

  const pushedOptions = {
    headerShown: true,
    // Without this the back button reads `(tabs)`: the label falls back to the
    // previous route's title, and the previous route is the tab group, whose
    // `Stack.Screen` has no title to give. All four of these are pushed from the
    // account menu, so that is where back goes and what it should say.
    headerBackTitle: t("common.menu"),
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerTintColor: colors.foreground,
    headerTitleStyle: {
      fontFamily: FONTS.semibold,
      fontSize: 18,
      letterSpacing: -0.27,
    },
    headerBackTitleStyle: {
      fontFamily: FONTS.regular,
      fontSize: 16,
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
        name="wallet"
        options={{ ...pushedOptions, title: t("nav.wallets") }}
      />
      <Stack.Screen
        name="credit-card"
        options={{ ...pushedOptions, title: t("nav.creditCards") }}
      />
      <Stack.Screen
        name="category"
        options={{ ...pushedOptions, title: t("nav.categories") }}
      />
      <Stack.Screen
        name="settings"
        options={{ ...pushedOptions, title: t("nav.settings") }}
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
