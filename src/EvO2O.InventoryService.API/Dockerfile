# Base runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# SDK build image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files for dependency caching
COPY ["EvO2O.InventoryService.API/EvO2O.InventoryService.API.csproj", "EvO2O.InventoryService.API/"]
COPY ["EvO2O.InventoryService.Infrastructure/EvO2O.InventoryService.Infrastructure.csproj", "EvO2O.InventoryService.Infrastructure/"]
COPY ["EvO2O.InventoryService.Application/EvO2O.InventoryService.Application.csproj", "EvO2O.InventoryService.Application/"]
COPY ["EvO2O.InventoryService.Domain/EvO2O.InventoryService.Domain.csproj", "EvO2O.InventoryService.Domain/"]

# Restore packages
RUN dotnet restore "EvO2O.InventoryService.API/EvO2O.InventoryService.API.csproj"

# Copy the remaining source files and compile
COPY . .
WORKDIR "/src/EvO2O.InventoryService.API"
RUN dotnet build "EvO2O.InventoryService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EvO2O.InventoryService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime environment
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EvO2O.InventoryService.API.dll"]
