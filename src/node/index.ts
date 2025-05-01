#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { decode } from "@here/flexpolyline"
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
      actions: Array<{
        instruction: string;
      }>;
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
  sourceUpdated: string;
  results : Array<{
    location: {
      length: number;
    };
    incidentDetails: {
      description: string;
      startTime: string;
      endTime: string;
      criticality: string;
      type: string;
    };    
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
        enum: ["car", "pedestrian", "bicycle", "truck", "scooter", "bus", "taxi"],        
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
      }
    },
    required: ["latitude", "longitude", "query"],
  },
};

const TRAFFIC_TOOL: Tool = {
  name: "maps_get_traffic_incidents",
  description: "Retrieve traffic incidents within a circle",
  inputSchema: {
    type: "object",
    properties: {
      center: {
        type: "string",
        description: "center coordinates in 'latitude,longitude' format",
      },
      radius: {
        type: "number",
        description: "radius in meters, default is 1000 meters",
      },
    },
    required: ["center", "radius"],
  },
};

const DISPLAY_TOOL: Tool = {
  name: "maps_display",
  description: "Show a map with the given coordinates and zoom level",
  inputSchema: {
    type: "object",
    properties: {
      center: {
        type: "string",
        description: "center coordinates in 'latitude,longitude' format",
      },
      zoomLevel: {
        type: "number",
        description: "zoom level ranges from 0(global level) to 20(most zoomed-in level). default is 14",
      },
      style: {
        type: "string",
        description: "style of the map, default is 'explore.day'. 'day' is the light scheme, while " +
          "'night' is the dark scheme. The 'lite' variant educes emphasis on intricate road details " + 
          "making it easier to overlay additional information or custom layers onto the map. The " +
          "'logistics' variant is optimized for logistics and transportation applications. The 'topo' " +
          "variant is optimized for topographic maps, which are useful for displaying elevation data " +
          "and other topographic features. The 'satellite.day' is a style displying satellite imagery" + 
          " without labels",
        enum: [   "explore.day",
          "explore.night",
          "explore.satellite.day",
          "lite.day",
          "lite.night",
          "lite.satellite.day",
          "logistics.day",
          "logistics.night",
          "logistics.satellite.day",
          "satellite.day",
          "topo.day",
          "topo.night"],
      }
    },
    required: ["center", "zoomLevel", "style"],
  },
};

const MAPS_TOOLS = [
  GEOCODE_TOOL,
  REVERSE_GEOCODE_TOOL,
  ROUTING_TOOL,
  PLACES_SEARCH_TOOL,
  TRAFFIC_TOOL,
  DISPLAY_TOOL,
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
  url.searchParams.append("return", "summary,polyline,actions,instructions");
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
  const polyline = decode(route.sections[0].polyline).polyline;
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            summary: route.sections[0].summary,
            polyline: polyline.map((point) => [
              parseFloat(point[0].toFixed(5)),
              parseFloat(point[1].toFixed(5)),
            ]),
            actions: route.sections[0].actions,
          },
          null,
          0
        ),
      },
    ],
    isError: false,
  };
}

async function handlePlacesSearch(latitude: number, longitude: number, query: string) {
  const url = new URL("https://discover.search.hereapi.com/v1/discover");
  url.searchParams.append("at", `${latitude},${longitude}`);
  url.searchParams.append("q", query);
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

async function handleTrafficIncidents(center: string, radius: number) {
  const url = new URL("https://data.traffic.hereapi.com/v7/incidents");
  url.searchParams.append("in", "circle:" + center + ";r=" + radius);
  url.searchParams.append("locationReferencing", "none");
  url.searchParams.append("apiKey", HERE_MAPS_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json() as TrafficIncidentsResponse;

  if (!data.results || data.results.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No traffic incidents found in the radius of ${radius} meters around ${center}`,
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
          data.results.slice(0,10).map((result: any) => ({
            description: result.incidentDetails.description,
            startTime: result.incidentDetails.startTime,
            endTime: result.incidentDetails.endTime,
            type: result.incidentDetails.type,
            criticality: result.incidentDetails.criticality,
          })),
          null,
          0
        ),
      },
    ],
    isError: false,
  };
  
  // Debugging raw response
  /*
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(await response.json(), null, 2),
      },
    ],
    isError: false,
  };
  */
}

async function handleDisplay(center: string, zoomLevel: number, style: string) {
  // Strip spaces inside the lat/lon coordinates
  center = center.replace(/\s+/g, "");
  const url = "https://maps.hereapi.com/mia/v3/base/mc/center:" + 
    center + ";zoom=" + zoomLevel + "/480x370/png8?apikey=" + HERE_MAPS_API_KEY + "&style=" + style;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            image_url: url,
          },
          null,
          0
        )
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

      case "maps_search_places": {
        const { latitude, longitude, query } = request.params.arguments as {
          latitude: number;
          longitude: number;
          query: string;
        };
        return await handlePlacesSearch(latitude, longitude, query);
      }

      case "maps_get_traffic_incidents": {
        const { center, radius } = request.params.arguments as { center: string; radius: number };
        return await handleTrafficIncidents(center, radius);
      }

      case "maps_display": {
        const { center, zoomLevel, style } = request.params.arguments as { center: string; zoomLevel: number; style: string };
        return await handleDisplay(center, zoomLevel, style);
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