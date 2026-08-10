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

import { AppBar, PushedHeader } from "@/components/app-bar";
import { Toaster } from "@/components/toaster";
import { authClient } from "@/lib/auth-client";
import { AppI18nProvider } from "@/lib/i18n";
import { useCreateTransactionActions } from "@/modules/transaction/components/create-transaction-actions";
import { ThemeProvider, useColors, useTheme } from "@/theme/theme-provider";
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
 * **The screen transitions stay native; the bars do not.** A pushed screen still slides
 * the way the platform slides one, because that is behaviour rather than appearance —
 * but every header is a view this app draws (`header`, which is what turns the native
 * one off), so the two platforms show one design instead of two.
 *
 * That also retires a whole class of bug the material cost. A translucent bar has to be
 * told its own tone, because this app's mode is its own rather than the system's and
 * `Appearance.setColorScheme` reaches neither bar (see `theme-provider.tsx`) — get it
 * wrong and a phone in light mode draws a white band across a dark app. An opaque bar
 * on `colors.background` cannot be wrong. It also contributes layout height, so
 * nothing scrolls underneath and no screen has to reason about content insets.
 *
 * The tab group carries the account mark and the create action as its header, declared
 * once for all three tabs. The five pushed screens each get `PushedHeader`.
 */
function AppStack() {
  const t = useTranslate();
  const colors = useColors();
  const createTransaction = useCreateTransactionActions();

  function pushed(title: string) {
    return {
      headerShown: true,
      header: () => <PushedHeader title={title} />,
    };
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: true,
            header: () => <AppBar actions={createTransaction.actions} />,
          }}
        />
        <Stack.Screen name="login" />
        <Stack.Screen name="wallet" options={pushed(t("nav.wallets"))} />
        <Stack.Screen
          name="credit-card"
          options={pushed(t("nav.creditCards"))}
        />
        <Stack.Screen name="category" options={pushed(t("nav.categories"))} />
        <Stack.Screen name="settings" options={pushed(t("nav.settings"))} />
        <Stack.Screen
          name="transaction-import"
          options={pushed(t("transaction.import.title"))}
        />
      </Stack>
      {/* The header hands back elements, but the sheets they open have to be mounted by
          something that outlives a screen — and staying mounted is what keeps their
          reset-on-open behaviour. */}
      {createTransaction.sheets}
    </>
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
