import Lean.Elab.ParseImportsFast
open Lean

def main (args : List String) : IO Unit := do
  let files ← match args with
    | ["--files-from", path] => pure ((← IO.FS.readFile path).splitOn "\n" |>.filter (· != ""))
    | _ => pure args
  for file in files do
    let header ← Lean.parseImports' (← IO.FS.readFile file) file
    let imports := header.imports.filter (fun i => i.module != `Init)
    let names := imports.map (fun i => Json.str i.module.toString)
    IO.println (Json.compress (Json.mkObj [("file", Json.str file), ("imports", Json.arr names)]))
