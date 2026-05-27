import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchPreferences, updatePreferences, type UserPreferences } from "@/lib/preferences"
import { Button } from "./ui/button"
import { Loader2, Save, FileJson } from "lucide-react"

export function PreferenceManager() {
  const [jsonInput, setJsonInput] = useState("")
  const queryClient = useQueryClient()

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["preferences"],
    queryFn: fetchPreferences,
  })

  useEffect(() => {
    if (preferences) {
      setJsonInput(JSON.stringify(preferences, null, 2))
    }
  }, [preferences])

  const mutation = useMutation({
    mutationFn: (newPrefs: UserPreferences) => updatePreferences(newPrefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] })
      alert("Preferences updated successfully!")
    },
    onError: (err: any) => {
      alert("Error updating preferences: " + err.message)
    },
  })

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      mutation.mutate(parsed)
    } catch (e) {
      alert("Invalid JSON format")
    }
  }

  if (isLoading) return <Loader2 className="h-6 w-6 animate-spin m-auto" />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileJson className="h-4 w-4" />
          AI Preference JSON
        </h3>
        <Button onClick={handleSave} disabled={mutation.isPending} size="sm">
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
          Save Config
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mb-2">
        Paste AI-generated JSON configuration here to refine your scheduling logic.
      </p>

      <textarea
        className="w-full h-48 p-3 text-xs font-mono bg-muted/50 border rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        spellCheck={false}
      />

      <div className="text-[10px] text-muted-foreground p-2 border rounded bg-muted/20">
        <strong>Tip:</strong> You can ask an external AI to "Generate a Planaro preference JSON for a person who wants 15 min buffers and prefers working between 10am and 4pm."
      </div>
    </div>
  )
}
