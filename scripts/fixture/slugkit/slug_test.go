package slugkit

import "testing"

func TestSlug(t *testing.T) {
	tests := []struct {
		title string
		want  string
	}{
		{"Hello World", "hello-world"},
		{"Go 1.27 Released!", "go-127-released"},
		{"  Trim  Me  ", "trim-me"},
		{"a---b", "a-b"},
	}
	for _, tt := range tests {
		if got := Slug(tt.title); got != tt.want {
			t.Errorf("Slug(%q) = %q, want %q", tt.title, got, tt.want)
		}
	}
}
