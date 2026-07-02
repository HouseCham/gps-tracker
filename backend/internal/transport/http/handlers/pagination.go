package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/log"
)

const (
	defaultPage     = 1
	defaultPageSize = 20
	maxPageSize     = 100
)

// parsePagination reads ?page and ?page_size from the request, falling
// back to defaults on missing/invalid input and clamping page_size to
// [1, maxPageSize]. The caller supplies the desired default page size.
func parsePagination(c fiber.Ctx, defaultSize int) (page, pageSize int) {
	page = defaultPage
	if raw := c.Query("page"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			page = parsed
		} else {
			log.Warn("parsePagination", "invalid page", "value", raw, "err", err)
		}
	}
	if page < 1 {
		page = defaultPage
	}

	pageSize = defaultSize
	if raw := c.Query("page_size"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil {
			pageSize = parsed
		} else {
			log.Warn("parsePagination", "invalid page_size", "value", raw, "err", err)
		}
	}
	if pageSize < 1 || pageSize > maxPageSize {
		pageSize = defaultSize
	}

	return page, pageSize
}
