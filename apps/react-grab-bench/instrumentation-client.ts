if (
  process.env.NODE_ENV === "development" &&
  !/library=(click-to-react-component|open)/.test(window.location.search)
) {
  void import("react-grab");
}
