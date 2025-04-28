# HERE Maps MCP Server

This project provides a Model Context Protocol (MCP) compliant server that exposes functionalities from the HERE Maps Platform APIs as tools for Language Models.

## Goal

The aim is to allow LLMs to interact with HERE Maps services like Geocoding, Reverse Geocoding, Routing, and Places Search through the standardized MCP interface.

## HERE Maps Tools (MCP Mapping)

The following HERE Maps services are implemented as MCP tools:

1.  **Geocoding:**
    *   **MCP Tool:** `maps_geocode`
    *   **Description:** Convert an address into geographic coordinates
    *   **HERE API:** [Geocoding & Search API v7 - Geocode](https://developer.here.com/documentation/geocoding-search-api/api-reference-swagger.html)
    *   **Input:** `address` (string)
    *   **Output:** JSON with `location` (lat/lng coordinates), `address` (formatted address), and `id`

2.  **Reverse Geocoding:**
    *   **MCP Tool:** `maps_reverse_geocode`
    *   **Description:** Convert coordinates into an address
    *   **HERE API:** [Geocoding & Search API v7 - Reverse Geocode](https://developer.here.com/documentation/geocoding-search-api/api-reference-swagger.html)
    *   **Input:** `latitude` (number), `longitude` (number)
    *   **Output:** JSON with `address` (formatted address), `position` (lat/lng coordinates), and `id`

3.  **Routing (Directions):**
    *   **MCP Tool:** `maps_directions`
    *   **Description:** Get directions between two points using HERE Maps Routing API
    *   **HERE API:** [Routing API v8](https://developer.here.com/documentation/routing-api/api-reference-swagger.html)
    *   **Input:** 
        * `origin` (string in 'latitude,longitude' format)
        * `destination` (string in 'latitude,longitude' format)
        * `transportMode` (string: "car", "pedestrian", "bicycle", "truck", "scooter", "bus", "taxi")
    *   **Output:** JSON with `summary` (duration and length), `polyline` (route coordinates), and `actions` (navigation instructions)

4.  **Places Search (Points of Interest):**
    *   **MCP Tool:** `maps_search_places`
    *   **Description:** Search for places (e.g., restaurants, ATMs) near a specific location
    *   **HERE API:** [Geocoding & Search API v7 - Discover](https://developer.here.com/documentation/geocoding-search-api/api-reference-swagger.html)
    *   **Input:** `latitude` (number), `longitude` (number), `query` (string, e.g., "coffee", "restaurant")
    *   **Output:** List of places, each with `name`, `address`, `position` (lat/lng coordinates), and `category`

5.  **Traffic Information:**
    *   **MCP Tool:** `maps_get_traffic_incidents`
    *   **Description:** Retrieve traffic incidents within a circle
    *   **HERE API:** [Traffic API v7](https://developer.here.com/documentation/traffic-api/api-reference-swagger.html)
    *   **Input:**
        * `center` (string in 'latitude,longitude' format)
        * `radius` (number in meters)
    *   **Output:** List of incidents with `description`, `startTime`, `endTime`, `type`, and `criticality`

## Getting Started

1. Set up your HERE Maps API Key:
   ```bash
   export HERE_MAPS_API_KEY=your_api_key_here
   ```

## MCP Integration


## HERE API Documentation

Refer to the official HERE Developer Portal for detailed API references:

*   [HERE Geocoding & Search API v7](https://www.here.com/docs/bundle/geocoding-and-search-api-v7-api-reference/page/index.html)
*   [HERE Routing API v8](https://www.here.com/docs/bundle/routing-api-v8-api-reference/page/index.html)
*   [HERE Traffic API v7](https://www.here.com/docs/bundle/traffic-api-v7-api-reference/page/index.html)
*   [Authentication Guide (API Key)](https://www.here.com/docs/bundle/identity-and-access-management-developer-guide/page/topics/manage-apps.html) - Note: You'll likely use the simple API Key method for server-side calls.

## Contributing

Feel free to fork this repository and adapt it to your needs. Contributions are welcome if you wish to refine the tool definitions or implementation details.
