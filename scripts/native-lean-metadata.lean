import Lean
open Lean

structure RequestedDecl where
  id : String
  module : String
  deriving FromJson

structure RequestedSnapshot where
  declarations : Array RequestedDecl
  deriving FromJson

def moduleName (env : Environment) (n : Name) : Name :=
  match env.getModuleIdxFor? n with
  | some i => (env.header.moduleNames[i.toNat]?).getD `_unknown
  | none => `_unknown

def recordedRange (env : Environment) (n : Name) : Json :=
  -- Exact declaration extension entry only; never borrow a parent range.
  let found := declRangeExt.find? (level := .exported) env n <|> declRangeExt.find? (level := .server) env n
  match found with
  | none => Json.null
  | some r => Json.mkObj [
      ("line", toJson r.range.pos.line), ("column", toJson r.range.pos.column),
      ("endLine", toJson r.range.endPos.line), ("endColumn", toJson r.range.endPos.column)]

def printSignature (env : Environment) (n : Name) : IO Json := do
  let ctx : Core.Context := { fileName := "", fileMap := default, maxHeartbeats := 0, currNamespace := n.getPrefix }
  try
    let (sig, _) ← (Meta.MetaM.run' (PrettyPrinter.ppSignature n)).toIO ctx { env }
    return Json.str (toString sig.fmt)
  catch _ => return Json.null

def references (env : Environment) (names : Array Name) : Json :=
  toJson <| (names.qsort Name.lt).map fun n => Json.mkObj [
    ("id", Json.str n.toString), ("module", Json.str (moduleName env n).toString)]

unsafe def main (args : List String) : IO UInt32 := do
  let input :: output :: roots := args | throw (IO.userError "Usage: metadata <snapshot> <output> <root>...")
  if roots.isEmpty then throw (IO.userError "No roots")
  let raw ← IO.ofExcept (Json.parse (← IO.FS.readFile input))
  let req : RequestedSnapshot ← IO.ofExcept (fromJson? raw)
  initSearchPath (← findSysroot)
  enableInitializersExecution
  let env ← importModules (roots.toArray.map fun m => { module := m.toName }) {} (loadExts := true) (level := .private)
  let wanted := req.declarations.foldl (init := ({} : Std.HashMap String String)) fun acc d => acc.insert d.id d.module
  let matched := env.constants.fold (init := #[]) fun acc n ci =>
    if wanted[n.toString]? == some (moduleName env n).toString then acc.push (n, ci) else acc
  let mut rows : Array Json := #[]
  for (n, ci) in matched.qsort (fun a b => Name.lt a.1 b.1) do
    let signature ← printSignature env n
    let value := ci.value? (allowOpaque := true)
    rows := rows.push (Json.mkObj [
      ("id", Json.str n.toString), ("module", Json.str (moduleName env n).toString),
      ("statement", signature), ("range", recordedRange env n),
      ("valueAvailable", toJson value.isSome),
      ("typeReferences", references env ci.type.getUsedConstants),
      ("valueReferences", references env (value.map (·.getUsedConstants) |>.getD #[]))])
  IO.FS.writeFile output (toString (toJson rows))
  IO.println s!"Native Lean metadata: {rows.size}/{req.declarations.size} matched"
  return 0
