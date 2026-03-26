export default {
  default: {
    paths: ["features/**/*.feature"],
    import: ["features/support/**/*.ts", "features/steps/**/*.ts"],
    publishQuiet: true
  }
};
