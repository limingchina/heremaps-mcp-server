#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Response interfaces
interface HereMapsResponse {
  status: string;
  error_message?: string;
}

interface GeocodeResponse {
  items: Array<{
    title: string;
    id: string;
    position: {
      lat: number;
      lng: number;
    };
    address: {
      label: string;
    };
  }>;
}

interface ReverseGeocodeResponse {
  items: Array<{
    title: string;
    id: string;
    position: {
      lat: number;
      lng: number;
    };
    address: {
      label: string;
    };
  }>;
}

interface RoutingResponse {
  routes: Array<{
    sections: Array<{
      summary: {
        duration: number;
        length: number;
      };
      polyline: string;
    }>;
  }>;
}

interface PlacesSearchResponse {
  items: Array<{
    title: string;
    address: {
      label: string;
    };
    position: {
      lat: number;
      lng: number;
    };
    categories?: Array<{
      name: string;
    }>;
  }>;
}

interface TrafficIncidentsResponse {
  TRAFFIC_ITEMS: Array<{
    description: string;
    location: {
      latitude: number;
      longitude: number;
    };
    severity: string;
  }>;
}

function getApiKey(): string {
  const apiKey = process.env.HERE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("HERE_MAPS_API_KEY environment variable is not set");
    process.exit(1);
  }
  return apiKey;
}

const HERE_MAPS_API_KEY = getApiKey();

// Tool definitions
const GEOCODE_TOOL: Tool = {
  name: "maps_geocode",
  description: "Convert an address into geographic coordinates",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "The address to geocode",
      },
    },
    required: ["address"],
  },
};

const REVERSE_GEOCODE_TOOL: Tool = {
  name: "maps_reverse_geocode",
  description: "Convert coordinates into an address",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude coordinate",
      },
      longitude: {
        type: "number",
        description: "Longitude coordinate",
      },
    },
    required: ["latitude", "longitude"],
  },
};

const ROUTING_TOOL: Tool = {
  name: "maps_directions",
  description: "Get directions between two points using HERE Maps Routing API",
  inputSchema: {
    type: "object",
    properties: {
      origin: {
        type: "string",
        description: "Starting point coordinates in 'latitude,longitude' format",
      },
      destination: {
        type: "string",
        description: "Ending point coordinates in 'latitude,longitude' format",
      },
      transportMode: {
        type: "string",
        description: "Mode of transport (car, pedestrian, bicycle, etc.)",
        enum: ["car", "pedestrian", "bicycle", "truck", "scooter"],
      },
    },
    required: ["origin", "destination", "transportMode"],
  },
};

const PLACES_SEARCH_TOOL: Tool = {
  name: "maps_search_places",
  description: "Search for places (e.g., restaurants, ATMs) near a specific location",
  inputSchema: {
    type: "object",
    properties: {
      latitude: {
        type: "number",
        description: "Latitude of the location",
      },
      longitude: {
        type: "number",
        description: "Longitude of the location",
      },
      query: {
        type: "string",
        description: "Search query (e.g., 'coffee', 'restaurant')",
      },
      radius: {
        type: "number",
        description: "Search radius in meters",
      },
    },
    required: ["latitude", "longitude", "query"],
  },
};

const TRAFFIC_TOOL: Tool = {
  name: "maps_get_traffic_incidents",
  description: "Retrieve traffic incidents within a bounding box or along a route",
  inputSchema: {
    type: "object",
    properties: {
      boundingBox: {
        type: "string",
        description: "Bounding box in 'south,west;north,east' format",
      },
    },
    required: ["boundingBox"],
  },
};

const MAPS_TOOLS = [
  GEOCODE_TOOL,
  REVERSE_GEOCODE_TOOL,
  ROUTING_TOOL,
  PLACES_SEARCH_TOOL,
  TRAFFIC_TOOL,
] as const;

// API handlers
async function handleGeocode(address: string) {
  const url = new URL("https://geocode.search.hereapi.com/v1/geocode");
  url.searchParams.append("q", address);
  url.searchParams.append("apiKey", HERE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = (await response.json()) as GeocodeResponse;

  if (!data.items || data.items.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `Geocoding failed: No results found`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            location: data.items[0].position,
            address: data.items[0].address.label,
            id: data.items[0].id,
          },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

async function handleReverseGeocode(latitude: number, longitude: number) {
  const url = new URL("https://revgeocode.search.hereapi.com/v1/revgeocode");
  url.searchParams.append("at", `${latitude},${longitude}`);
  url.searchParams.append("apiKey", HERE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = (await response.json()) as ReverseGeocodeResponse;

  if (!data.items || data.items.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `Reverse geocoding failed: No results found`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            address: data.items[0].address.label,
            position: data.items[0].position,
            id: data.items[0].id,
          },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

async function handleRouting(
  origin: string,
  destination: string,
  transportMode: string
) {
  const url = new URL("https://router.hereapi.com/v8/routes");
  url.searchParams.append("origin", origin);
  url.searchParams.append("destination", destination);
  url.searchParams.append("transportMode", transportMode);
  url.searchParams.append("return", "summary,polyline");
  url.searchParams.append("apiKey", HERE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json() as RoutingResponse;

  if (!data.routes || data.routes.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `Routing failed: No routes found`,
        },
      ],
      isError: true,
    };
  }

  const route = data.routes[0];
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            summary: route.sections[0].summary,
            polyline: route.sections[0].polyline,
          },
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

async function handlePlacesSearch(latitude: number, longitude: number, query: string, radius: number) {
  const url = new URL("https://browse.search.hereapi.com/v1/browse");
  url.searchParams.append("at", `${latitude},${longitude}`);
  url.searchParams.append("q", query);
  url.searchParams.append("radius", radius.toString());
  url.searchParams.append("apiKey", HERE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json() as PlacesSearchResponse;

  if (!data.items || data.items.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No places found for query: ${query}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          data.items.map((item: any) => ({
            name: item.title,
            address: item.address.label,
            position: item.position,
            category: item.categories?.[0]?.name || "Unknown",
          })),
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

async function handleTrafficIncidents(boundingBox: string) {
  const url = new URL("https://traffic.ls.hereapi.com/traffic/6.3/incidents.json");
  url.searchParams.append("bbox", boundingBox);
  url.searchParams.append("apiKey", HERE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json() as TrafficIncidentsResponse;

  if (!data.TRAFFIC_ITEMS || data.TRAFFIC_ITEMS.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No traffic incidents found for bounding box: ${boundingBox}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          data.TRAFFIC_ITEMS.map((item: any) => ({
            description: item.description,
            location: item.location,
            severity: item.severity,
          })),
          null,
          2
        ),
      },
    ],
    isError: false,
  };
}

// Server setup
const server = new Server(
  {
    name: "mcp-server/here-maps",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MAPS_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "maps_geocode": {
        const { address } = request.params.arguments as { address: string };
        return await handleGeocode(address);
      }

      case "maps_reverse_geocode": {
        const { latitude, longitude } = request.params.arguments as {
          latitude: number;
          longitude: number;
        };
        return await handleReverseGeocode(latitude, longitude);
      }

      case "maps_directions": {
        const { origin, destination, transportMode } = request.params.arguments as {
          origin: string;
          destination: string;
          transportMode: string;
        };
        return await handleRouting(origin, destination, transportMode);
      }

      case "find_places_nearby": {
        const { latitude, longitude, query, radius } = request.params.arguments as {
          latitude: number;
          longitude: number;
          query: string;
          radius: number;
        };
        return await handlePlacesSearch(latitude, longitude, query, radius);
      }

      case "get_traffic_incidents": {
        const { boundingBox } = request.params.arguments as { boundingBox: string };
        return await handleTrafficIncidents(boundingBox);
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${request.params.name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HERE Maps MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});