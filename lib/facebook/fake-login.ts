export async function fakeFacebookLogin(
  email: string,
  password: string
): Promise<{ success: boolean; sessionCookie?: string; error?: string }> {
  try {
    const res = await fetch("https://www.facebook.com/login/device-based/regular/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        email,
        pass: password,
        login: "Log In",
        next: "https://www.facebook.com/",
      }),
      redirect: "manual",
    })

    const setCookie = res.headers.get("set-cookie")
    if (setCookie) {
      const cUserMatch = setCookie.match(/c_user=([^;]+)/)
      if (cUserMatch) {
        return { success: true, sessionCookie: cUserMatch[1] }
      }
    }

    return { success: false, error: "Invalid credentials or login blocked" }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Login failed",
    }
  }
}
