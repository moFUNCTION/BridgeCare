import { useEffect } from "react";
import { useNavigation } from "react-router-dom";
import NProgress from "nprogress";

// Load nprogress styles when this hook is used (consumer can override by importing nprogress/nprogress.css first)
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, speed: 400 });

export function useProgressBar(): void {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      NProgress.start();
    } else {
      NProgress.done();
    }
  }, [navigation.state]);
}
