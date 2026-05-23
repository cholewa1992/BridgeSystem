{{/*
Standard names + labels.
*/}}
{{- define "bridge-system.name" -}}
{{- default "bridge-system" .Chart.Name -}}
{{- end -}}

{{- define "bridge-system.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "bridge-system.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "bridge-system.labels" -}}
app.kubernetes.io/name: {{ include "bridge-system.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/part-of: bridge-system
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
{{- end -}}

{{- define "bridge-system.backendName" -}}
{{- printf "%s-backend" (include "bridge-system.fullname" .) -}}
{{- end -}}

{{- define "bridge-system.frontendName" -}}
{{- printf "%s-frontend" (include "bridge-system.fullname" .) -}}
{{- end -}}

{{- define "bridge-system.postgresName" -}}
{{- printf "%s-postgres" (include "bridge-system.fullname" .) -}}
{{- end -}}

{{- define "bridge-system.secretName" -}}
{{- if .Values.secrets.existingSecret -}}
{{ .Values.secrets.existingSecret }}
{{- else -}}
{{ include "bridge-system.fullname" . }}-secrets
{{- end -}}
{{- end -}}

{{- define "bridge-system.dbUrl" -}}
{{- if .Values.postgres.embedded -}}
jdbc:postgresql://{{ include "bridge-system.postgresName" . }}:5432/bridge
{{- else -}}
{{ .Values.postgres.external.url }}
{{- end -}}
{{- end -}}

{{- define "bridge-system.backendImage" -}}
{{- $tag := .Values.image.backend.tag | default .Chart.AppVersion -}}
{{ .Values.image.backend.repository }}:{{ $tag }}
{{- end -}}

{{- define "bridge-system.frontendImage" -}}
{{- $tag := .Values.image.frontend.tag | default .Chart.AppVersion -}}
{{ .Values.image.frontend.repository }}:{{ $tag }}
{{- end -}}
