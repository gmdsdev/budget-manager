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

import { AccountMenuButton } from "@/components/account-menu-sheet";
import { Toaster } from "@/components/toaster";
import { authClient } from "@/lib/auth-client";
import { AppI18nProvider } from "@/lib/i18n";
import { useCreateTransactionActions } from "@/modules/transaction/components/create-transaction-actions";
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
 * Every bar in this app is a **native** one, which is what lets iOS draw it in its own
 * material rather than having React Native paint an imitation.
 *
 * `headerTransparent` is what makes a navigation bar a *material* rather than a fill:
 * left opaque it takes a solid background, and since this app's mode is its own rather
 * than the system's, that background resolved light while the app was dark — a white
 * band across the top. `Appearance.setColorScheme` does not reach it (see
 * `theme-provider.tsx`), so the tone is chosen here from the mode we are actually in,
 * which is also why the effect is named per mode rather than left to `systemDefault`.
 *
 * The tab group carries the account mark and the create action as its header, so that
 * bar is a real `UINavigationBar` shared by all three tabs. The four screens pushed
 * from the account menu keep their own, because a pushed screen needs the back
 * affordance the system already knows how to draw.
 */
function AppStack() {
  const t = useTranslate();
  const { mode, colors } = useTheme();
  const createTransaction = useCreateTransactionActions();

  const headerText = {
    headerTransparent: true,
    headerBlurEffect:
      mode === "dark"
        ? ("systemChromeMaterialDark" as const)
        : ("systemChromeMaterialLight" as const),
    headerTintColor: colors.foreground,
    headerTitleStyle: {
      fontFamily: FONTS.semibold,
      fontSize: 18,
      letterSpacing: -0.27,
    },
  };

  const pushedOptions = {
    ...headerText,
    headerShown: true,
    // Without this the back button reads `(tabs)`: the label falls back to the
    // previous route's title, and the previous route is the tab group, whose
    // `Stack.Screen` has no title to give. All four of these are pushed from the
    // account menu, so that is where back goes and what it should say.
    headerBackTitle: t("common.menu"),
    headerBackTitleStyle: {
      fontFamily: FONTS.regular,
      fontSize: 16,
    },
  };

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
            ...headerText,
            headerShown: true,
            // No title: the tab bar below already says which screen this is, so the
            // row is spent on the two things worth reaching instead.
            title: "",
            headerLeft: () => <AccountMenuButton />,
            unstable_headerRightItems: () => createTransaction.items,
          }}
        />
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
        <Stack.Screen
          name="transaction-import"
          options={{
            ...headerText,
            headerShown: true,
            // The only pushed screen with no place to name on its back button: it is
            // reached from the create affordance, which rides the bar on all three
            // tabs, so whichever tab back returns to is not knowable here. The
            // chevron on its own is the honest label.
            headerBackButtonDisplayMode: "minimal",
            title: t("transaction.import.title"),
          }}
        />
      </Stack>
      {/* A native bar button hands back a callback and nothing else, so the sheets it
          opens have to be mounted by something that renders — and staying mounted is
          what keeps their reset-on-open behaviour. */}
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
