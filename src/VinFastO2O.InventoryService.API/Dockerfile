# Base runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# SDK build image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files for dependency caching
COPY ["VinFastO2O.InventoryService.API/VinFastO2O.InventoryService.API.csproj", "VinFastO2O.InventoryService.API/"]
COPY ["VinFastO2O.InventoryService.Infrastructure/VinFastO2O.InventoryService.Infrastructure.csproj", "VinFastO2O.InventoryService.Infrastructure/"]
COPY ["VinFastO2O.InventoryService.Application/VinFastO2O.InventoryService.Application.csproj", "VinFastO2O.InventoryService.Application/"]
COPY ["VinFastO2O.InventoryService.Domain/VinFastO2O.InventoryService.Domain.csproj", "VinFastO2O.InventoryService.Domain/"]

# Restore packages
RUN dotnet restore "VinFastO2O.InventoryService.API/VinFastO2O.InventoryService.API.csproj"

# Copy the remaining source files and compile
COPY . .
WORKDIR "/src/VinFastO2O.InventoryService.API"
RUN dotnet build "VinFastO2O.InventoryService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VinFastO2O.InventoryService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime environment
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VinFastO2O.InventoryService.API.dll"]
