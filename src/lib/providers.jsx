// In Next.js, this file would be called: app/providers.jsx
"use client"

// We can not useState or useRef in a server component, which is why we are
// extracting this part out into it's own file with 'use client' on top
import { useState, useEffect, useMemo } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
// import { SessionProvider } from "next-auth/react"
// import TaskContextProvider from "@/contexts/TasksContext"
// import SeminarContextProvider from "@/contexts/SeminarContext"
// import PostContextProvider from "@/contexts/PostContext"
// import EventContextProvider from "@/contexts/EventContext"
// import NotebookContextProvider from "@/contexts/NotebookContext"
// import UserContextProvider from "@/contexts/UserContext"
// import MomentContextProvider from "@/contexts/MomentContext"
// import LayoutContextProvider from "@/contexts/LayoutContext"
// import ProjectContextProvider from "@/contexts/ProjectContext"
// import WorkspaceContextProvider from "@/contexts/WorkspaceContext"
// import TradingRobotContextProvider from "@/contexts/TradingRobotContext"
// import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter'
// import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
// import theme from "@/lib/muitheme"
// import { loadStripe } from '@stripe/stripe-js'
// import { Elements } from "@stripe/react-stripe-js"
import { ThemeProvider as NextjsThemeProvider, useTheme as useNextTheme } from "next-themes"
// import { getTheme } from "@/lib/muitheme"
// import NewsContextProvider from "@/contexts/NewsContext"
// import NewsCategoryContextProvider from "@/contexts/NewsCategoryContext"
// import SliderContextProvider from "@/contexts/SliderContext"

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// function ThemeWrapper({ children }) {
//   const { resolvedTheme } = useNextTheme()
//   const [mounted, setMounted] = useState(false)
//   useEffect(() => setMounted(true), [])

//   // const theme = useMemo(() => getTheme(resolvedTheme === 'dark' ? 'dark' : 'light'), [resolvedTheme])

//   if (!mounted) return null

//   return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
// }

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient(
        {
          defaultOptions: {
            queries: {
              // With SSR, we usually want to set some default staleTime
              // above 0 to avoid refetching immediately on the client
              staleTime: 5 * 60 * 1000, // stale time is where the query will fetch again the data when the tab is changed
              // refetchInterval: 4 * 1000, // refetch interval will refetch the data in x time - this is not ok for the server
              gcTime: 5 * 60 * 1000, // means that if the component is unmounted, the react query will remove the use query functions
            },
          },
        }
      )
  )

  const options = {
    // passing the client secret obtained from the server
    clientSecret: '{{CLIENT_SECRET}}',
  };

  return (
    // <SessionProvider>
    // <AppRouterCacheProvider>
      <NextjsThemeProvider attribute='class' defaultTheme="system" enableSystem>
        {/* <ThemeWrapper> */}
          <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools />
            {/* <UserContextProvider> */}
              {/* <LayoutContextProvider> */}
                {/* <PostContextProvider> */}
                  {/* <TaskContextProvider> */}
                    {/* <SeminarContextProvider> */}
                      {/* <WorkspaceContextProvider> */}
                        {/* <ProjectContextProvider> */}
                          {/* <NotebookContextProvider> */}
                            {/* <MomentContextProvider> */}
                              {/* <TradingRobotContextProvider> */}
                                {/* <EventContextProvider> */}
                                  {/* <NewsContextProvider> */}
                                    {/* <NewsCategoryContextProvider> */}
                                      {/* <SliderContextProvider> */}
                                        {children}
                                      {/* </SliderContextProvider> */}
                                    {/* </NewsCategoryContextProvider> */}
                                  {/* </NewsContextProvider> */}
                                {/* </EventContextProvider> */}
                              {/* </TradingRobotContextProvider> */}
                            {/* </MomentContextProvider> */}
                          {/* </NotebookContextProvider> */}
                        {/* </ProjectContextProvider> */}
                      {/* </WorkspaceContextProvider> */}
                    {/* </SeminarContextProvider> */}
                  {/* </TaskContextProvider> */}
                {/* </PostContextProvider> */}
              {/* </LayoutContextProvider> */}
            {/* </UserContextProvider> */}
          </QueryClientProvider>
        {/* </ThemeWrapper> */}
      </NextjsThemeProvider>
    // </AppRouterCacheProvider>
    // </SessionProvider>
  )
}