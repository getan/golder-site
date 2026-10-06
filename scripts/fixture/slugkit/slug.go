// Package slugkit turns titles into URL-friendly slugs.
package slugkit

import "strings"

// Slug converts a title into a URL-friendly slug.
func Slug(title string) string {
	return strings.ToLower(strings.ReplaceAll(title, " ", "-"))
}
