# HERE Maps MCP Server

This project provides a Model Context Protocol (MCP) compliant server that exposes functionalities from the HERE Maps Platform APIs as tools for Language Models.

## Goal

The aim is to allow LLMs to interact with HERE Maps services like Geocoding, Reverse Geocoding, Routing, and Places Search through the standardized MCP interface.

## HERE Maps Tools (MCP Mapping)

Here's a potential mapping of HERE Maps services to MCP tools:

1.  **Geocoding:**
    *   **MCP Tool:** `maps_geocode`
    *   **Description:** Converts a street address into geographic coordinates (latitude, longitude).
    *   **HERE API:** [Geocoding & Search API v7 - Geocode](https://developer.here.com/documentation/geocoding-search-api/api-reference-swagger.html)
    *   **Input:** `address` (string)
    *   **Output:** `latitude`, `longitude`, `formatted_address`, `confidence`

2.  **Reverse Geocoding:**
    *   **MCP Tool:** `maps_reverse_geocode`
    *   **Description:** Converts geographic coordinates (latitude, longitude) into a human-readable address.
    *   **HERE API:** [Geocoding & Search API v7 - Reverse Geocode](https://developer.here.com/documentation/geocoding-search-api/api-reference-swagger.html)
    *   **Input:** `latitude`, `longitude` (numbers)
    *   **Output:** `address`, `city`, `state`, `postal_code`, `country`

3.  **Routing (Directions):**
    *   **MCP Tool:** `maps_directions`
    *   **Description:** Calculates driving directions between two points (by coordinates or address).
    *   **HERE API:** [Routing API v8](https://developer.here.com/documentation/routing-api/api-reference-swagger.html)
    *   **Input:** `origin_lat`, `origin_lon`, `destination_lat`, `destination_lon` (or `origin_address`, `destination_address`)
    *   **Output:** `distance` (meters/km), `duration` (seconds/minutes), `route_summary` (text instructions)

4.  **Places Search (Points of Interest):**
    *   **MCP Tool:** `maps_search_places`
    *   **Description:** Searches for places (like restaurants, ATMs, etc.) near a specific location.
    *   **HERE API:** [Geocoding & Search API v7 - Browse/Discover](https://developer.here.com/documentation/geocoding-search-api/api-reference-swagger.html)
    *   **Input:** `latitude`, `longitude`, `query` (e.g., "coffee"), `radius` (meters)
    *   **Output:** List of places, each with `name`, `address`, `latitude`, `longitude`, `category`

5.  **Traffic Information:** (Optional, more complex)
    *   **MCP Tool:** `maps_get_traffic_incidents`
    *   **Description:** Retrieves traffic incidents within a bounding box or along a route.
    *   **HERE API:** [Traffic API v8](https://developer.here.com/documentation/traffic-api/api-reference-swagger.html)
    *   **Input:** `bounding_box` (coordinates) or `route_id`
    *   **Output:** List of incidents with `description`, `location`, `severity`

## Getting Started


## MCP Integration


## HERE API Documentation

Refer to the official HERE Developer Portal for detailed API references:

*   [HERE Geocoding & Search API v7](https://developer.here.com/documentation/geocoding-search-api/)
*   [HERE Routing API v8](https://developer.here.com/documentation/routing-api/)
*   [HERE Traffic API v8](https://developer.here.com/documentation/traffic-api/)
*   [Authentication Guide (API Key)](https://developer.here.com/documentation/identity-access-management/dev_guide/topics/sdk.html#step-1-get-credentials) - Note: You'll likely use the simple API Key method for server-side calls.

## Contributing

Feel free to fork this repository and adapt it to your needs. Contributions are welcome if you wish to refine the tool definitions or implementation details.
