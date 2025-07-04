"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Plug,
  Edit,
  Trash2,
  Plus,
  Minus,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface ConnectionConfig {
  url: string;
  apiKey: string;
  token: string;
}

interface ApiMethod {
  method: string;
  supported: boolean;
  color: string;
}

interface TableData {
  [key: string]: any;
}

const checkSupportedMethods = async (config: ConnectionConfig) => {
  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  const supportedMethods: ApiMethod[] = [];

  for (const method of methods) {
    try {
      const response = await fetch(config.url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        supportedMethods.push({
          method,
          supported: true,
          color: "bg-green-500",
        });
      } else {
        supportedMethods.push({
          method,
          supported: false,
          color: "bg-red-500",
        });
      }
    } catch {
      supportedMethods.push({ method, supported: false, color: "bg-red-500" });
    }
  }

  return supportedMethods;
};

// Custom Input Component with Clear Button
const InputWithClear = ({
  value,
  onChange,
  onClear,
  placeholder,
  type = "text",
  id,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder?: string;
  type?: string;
  id?: string;
  className?: string;
}) => {
  return (
    <div className="relative">
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`pr-8 ${className}`}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
          onClick={onClear}
        >
          <X className="h-3 w-3 text-gray-500" />
        </Button>
      )}
    </div>
  );
};

export default function ApiConnectionForm() {
  const [config, setConfig] = useState<ConnectionConfig>({
    url: "",
    apiKey: "",
    token: "",
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supportedMethods, setSupportedMethods] = useState<ApiMethod[]>([
    { method: "GET", supported: false, color: "bg-gray-500" },
    { method: "POST", supported: false, color: "bg-gray-500" },
    { method: "PUT", supported: false, color: "bg-gray-500" },
    { method: "DELETE", supported: false, color: "bg-gray-500" },
    { method: "PATCH", supported: false, color: "bg-gray-500" },
  ]);

  const [apiData, setApiData] = useState<any>(null);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [postFormFields, setPostFormFields] = useState<
    Array<{ key: string; value: string; type: string }>
  >([{ key: "", value: "", type: "text" }]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<TableData>({});

  const getHeaders = () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.apiKey) {
      headers["X-API-Key"] = config.apiKey;
    }

    if (config.token) {
      headers["Authorization"] = `Bearer ${config.token}`;
    }

    return headers;
  };

  const testConnection = useCallback(async () => {
    if (!config.url) {
      toast.error("Please enter API URL");
      return;
    }

    // Validate URL format
    try {
      new URL(config.url);
    } catch {
      toast.error(
        "Please enter a valid URL (e.g., https://api.example.com/data)"
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(config.url, {
        method: "GET",
        headers: getHeaders(),
      });

      if (response.ok) {
        // Check if it's a JSON API
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          toast.success("Connection test successful! JSON API detected.");
        } else {
          toast.warning(
            "Connection successful, but API may not return JSON data."
          );
        }
        const methods = await checkSupportedMethods(config);
        setSupportedMethods(methods);
      } else {
        toast.error(
          `Connection failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Connection error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error(
          "Connection failed: Network error or CORS issue. Check if the API allows cross-origin requests."
        );
      } else {
        toast.error("Connection failed: Unable to reach the API");
      }
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const connectToApi = useCallback(async () => {
    if (!config.url) {
      toast.error("Please enter API URL");
      return;
    }

    // Validate URL format
    try {
      new URL(config.url);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(config.url, {
        headers: getHeaders(),
      });

      if (response.ok) {
        setIsConnected(true);
        toast.success("Successfully connected to API!");
        await fetchData();
      } else {
        toast.error(
          `Connection failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Connection error:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Connection failed: Network error or CORS issue");
      } else {
        toast.error("Connection failed: Unable to connect to API");
      }
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const refreshConnection = useCallback(async () => {
    if (!isConnected) {
      toast.error("Not connected to API");
      return;
    }

    setIsLoading(true);
    try {
      await fetchData();
      const methods = await checkSupportedMethods(config);
      setSupportedMethods(methods);
      toast.success("Connection refreshed!");
    } catch (error) {
      toast.error("Failed to refresh connection");
      console.error("Refresh error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, config]);

  const disconnectFromApi = useCallback(() => {
    setIsConnected(false);
    setApiData(null);
    setTableData([]);
    setSupportedMethods([
      { method: "GET", supported: false, color: "bg-gray-500" },
      { method: "POST", supported: false, color: "bg-gray-500" },
      { method: "PUT", supported: false, color: "bg-gray-500" },
      { method: "DELETE", supported: false, color: "bg-gray-500" },
      { method: "PATCH", supported: false, color: "bg-gray-500" },
    ]);
    toast.success("Disconnected from API!");
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(config.url, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();

        // If it's HTML, show a more helpful error
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          throw new Error(
            "API returned HTML instead of JSON. Please check if the URL is correct and points to a JSON API endpoint."
          );
        }

        // Try to parse as JSON anyway, in case content-type is wrong
        try {
          const data = JSON.parse(text);
          setApiData(data);

          if (Array.isArray(data)) {
            setTableData(data);
          } else if (data && typeof data === "object") {
            setTableData([data]);
          }
          return;
        } catch {
          throw new Error(
            `API returned non-JSON content: ${text.substring(0, 100)}...`
          );
        }
      }

      const data = await response.json();
      setApiData(data);

      // Convert data to table format if it's an array
      if (Array.isArray(data)) {
        setTableData(data);
      } else if (data && typeof data === "object") {
        setTableData([data]);
      } else {
        // Handle primitive values
        setTableData([{ value: data }]);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch data";
      toast.error(errorMessage);
      setApiData(null);
      setTableData([]);
    }
  };

  const handlePostSubmit = async () => {
    const postData: Record<string, any> = {};
    postFormFields.forEach((field) => {
      if (field.key && field.value) {
        postData[field.key] =
          field.type === "number" ? Number(field.value) : field.value;
      }
    });

    if (Object.keys(postData).length === 0) {
      toast.error("Please add at least one field with data");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(config.url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        toast.success("Data posted successfully!");
        await fetchData();
      } else {
        const contentType = response.headers.get("content-type");
        let errorMessage = `POST failed: ${response.status} ${response.statusText}`;

        try {
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage += ` - ${JSON.stringify(errorData)}`;
          } else {
            const errorText = await response.text();
            if (errorText) {
              errorMessage += ` - ${errorText.substring(0, 100)}`;
            }
          }
        } catch {
          // Ignore parsing errors for error messages
        }

        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("POST error:", error);
      toast.error("POST request failed: Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (index: number, data: TableData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.url}/${data.id || index}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Data updated successfully!");
        setEditingRow(null);
        await fetchData();
      } else {
        toast.error(`PUT failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      toast.error("PUT request failed");
      console.error("PUT error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (index: number, data: TableData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.url}/${data.id || index}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      if (response.ok) {
        toast.success("Data deleted successfully!");
        await fetchData();
      } else {
        toast.error(`DELETE failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      toast.error("DELETE request failed");
      console.error("DELETE error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPostField = () => {
    setPostFormFields([
      ...postFormFields,
      { key: "", value: "", type: "text" },
    ]);
  };

  const removePostField = (index: number) => {
    if (postFormFields.length > 1) {
      setPostFormFields(postFormFields.filter((_, i) => i !== index));
    }
  };

  const updatePostField = (index: number, field: string, value: string) => {
    const updated = [...postFormFields];
    updated[index] = { ...updated[index], [field]: value };
    setPostFormFields(updated);
  };

  const clearPostField = (index: number, field: string) => {
    const updated = [...postFormFields];
    updated[index] = { ...updated[index], [field]: "" };
    setPostFormFields(updated);
  };

  const getTableColumns = () => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]);
  };

  const renderTable = (
    showActions = false,
    actionType: "edit" | "delete" = "edit"
  ) => {
    const columns = getTableColumns();

    if (columns.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      );
    }

    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold">
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                </TableHead>
              ))}
              {showActions && <TableHead className="w-32">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {editingRow === index && actionType === "edit" ? (
                      <div className="relative">
                        <Input
                          value={editFormData[column] || row[column] || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              [column]: e.target.value,
                            })
                          }
                          className="h-8 pr-8"
                        />
                        {(editFormData[column] || row[column]) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                            onClick={() =>
                              setEditFormData({
                                ...editFormData,
                                [column]: "",
                              })
                            }
                          >
                            <X className="h-3 w-3 text-gray-500" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm">
                        {String(row[column] || "")}
                      </span>
                    )}
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell>
                    {actionType === "edit" ? (
                      editingRow === index ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleEdit(index, { ...row, ...editFormData })
                            }
                            disabled={isLoading}
                            className="h-8 px-2"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRow(null);
                              setEditFormData({});
                            }}
                            className="h-8 px-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingRow(index);
                            setEditFormData(row);
                          }}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(index, row)}
                        disabled={isLoading}
                        className="h-8 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const handleUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfig((prev) => ({ ...prev, url: e.target.value }));
    },
    []
  );

  const handleApiKeyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfig((prev) => ({ ...prev, apiKey: e.target.value }));
    },
    []
  );

  const handleTokenChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setConfig((prev) => ({ ...prev, token: e.target.value }));
    },
    []
  );

  const clearUrl = useCallback(() => {
    setConfig((prev) => ({ ...prev, url: "" }));
  }, []);

  const clearApiKey = useCallback(() => {
    setConfig((prev) => ({ ...prev, apiKey: "" }));
  }, []);

  const clearToken = useCallback(() => {
    setConfig((prev) => ({ ...prev, token: "" }));
  }, []);

  const setExampleUrl = useCallback((url: string) => {
    setConfig((prev) => ({ ...prev, url }));
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            API Connection
          </CardTitle>
          <CardDescription>
            Configure your API connection settings and test connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="url">API URL</Label>
              <InputWithClear
                id="url"
                placeholder="https://masukan.api.test/anda"
                value={config.url}
                onChange={handleUrlChange}
                onClear={clearUrl}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key (Optional)</Label>
              <InputWithClear
                id="apiKey"
                type="password"
                placeholder="Your API key"
                value={config.apiKey}
                onChange={handleApiKeyChange}
                onClear={clearApiKey}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Token (Optional)</Label>
              <InputWithClear
                id="token"
                type="password"
                placeholder="Bearer token"
                value={config.token}
                onChange={handleTokenChange}
                onClear={clearToken}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={testConnection}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShieldAlert className="h-4 w-4 mr-2" />
              )}
              Test
            </Button>
            {!isConnected ? (
              <Button onClick={connectToApi} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plug className="h-4 w-4 mr-2" />
                )}
                Connect
              </Button>
            ) : (
              <Button
                onClick={disconnectFromApi}
                disabled={isLoading}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            )}
            <Button
              onClick={refreshConnection}
              disabled={isLoading || !isConnected}
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            {isConnected ? (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label>Supported Methods:</Label>
            <div className="flex gap-2 flex-wrap">
              {supportedMethods.map((method) => (
                <Badge
                  key={method.method}
                  className={`${method.color} text-white hover:opacity-80`}
                >
                  {method.method}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardContent className="pt-0">
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2">💡 Try these example APIs:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>JSONPlaceholder (Posts):</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExampleUrl("https://jsonplaceholder.typicode.com/posts")
                  }
                >
                  Use This
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>JSONPlaceholder (Users):</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExampleUrl("https://jsonplaceholder.typicode.com/users")
                  }
                >
                  Use This
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span>REST Countries API:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExampleUrl("https://restcountries.com/v3.1/all")
                  }
                >
                  Use This
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Make sure the API supports CORS for browser requests and
              returns JSON data.
            </p>
          </div>
        </CardContent>
      </Card>

      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>API Methods</CardTitle>
            <CardDescription>
              Interact with your API using different HTTP methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="get" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {supportedMethods.map((method) => (
                  <TabsTrigger
                    key={method.method}
                    value={method.method.toLowerCase()}
                    disabled={!method.supported}
                    className={
                      method.supported
                        ? "data-[state=active]:bg-green-500 data-[state=active]:text-white"
                        : ""
                    }
                  >
                    {method.method}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="get" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">GET Request</h3>
                  <Button onClick={fetchData} disabled={isLoading} size="sm">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Fetch Data
                  </Button>
                </div>

                {apiData && (
                  <div className="space-y-4">
                    <div>
                      <Label>JSON Response:</Label>
                      <ScrollArea className="h-64 w-full border rounded-md p-4 mt-2">
                        <pre className="text-sm">
                          {JSON.stringify(apiData, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>

                    <Separator />

                    <div>
                      <Label>Table View:</Label>
                      <div className="mt-2">{renderTable()}</div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="post" className="space-y-4">
                <h3 className="text-lg font-semibold">POST Request</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Form Fields:</Label>
                    <Button onClick={addPostField} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>

                  {postFormFields.map((field, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-4">
                        <InputWithClear
                          placeholder="Field name"
                          value={field.key}
                          onChange={(e) =>
                            updatePostField(index, "key", e.target.value)
                          }
                          onClear={() => clearPostField(index, "key")}
                        />
                      </div>
                      <div className="col-span-3">
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          value={field.type}
                          onChange={(e) =>
                            updatePostField(index, "type", e.target.value)
                          }
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="date">Date</option>
                        </select>
                      </div>
                      <div className="col-span-4">
                        <InputWithClear
                          placeholder="Value"
                          type={field.type}
                          value={field.value}
                          onChange={(e) =>
                            updatePostField(index, "value", e.target.value)
                          }
                          onClear={() => clearPostField(index, "value")}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          onClick={() => removePostField(index)}
                          size="sm"
                          variant="outline"
                          disabled={postFormFields.length === 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button onClick={handlePostSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Send POST Request
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="put" className="space-y-4">
                <h3 className="text-lg font-semibold">PUT Request</h3>
                <p className="text-sm text-muted-foreground">
                  Click the edit button on any row to modify the data
                </p>
                {renderTable(true, "edit")}
              </TabsContent>

              <TabsContent value="delete" className="space-y-4">
                <h3 className="text-lg font-semibold">DELETE Request</h3>
                <p className="text-sm text-muted-foreground">
                  Click the delete button on any row to remove the data
                </p>
                {renderTable(true, "delete")}
              </TabsContent>

              <TabsContent value="patch" className="space-y-4">
                <h3 className="text-lg font-semibold">PATCH Request</h3>
                <p className="text-sm text-muted-foreground">
                  Similar to PUT but for partial updates
                </p>
                {renderTable(true, "edit")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
