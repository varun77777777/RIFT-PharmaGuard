export function inferDiplotype(gt: string): string {
  switch (gt) {
    case "0/0":
      return "*1/*1"
    case "0/1":
    case "1/0":
      return "*1/*2"
    case "1/1":
      return "*2/*2"
    default:
      return "Unknown"
  }
}
