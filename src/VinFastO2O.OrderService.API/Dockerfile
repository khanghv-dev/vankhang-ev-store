# Base runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# SDK build image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files for dependency caching
COPY ["VinFastO2O.OrderService.API/VinFastO2O.OrderService.API.csproj", "VinFastO2O.OrderService.API/"]
COPY ["VinFastO2O.OrderService.Infrastructure/VinFastO2O.OrderService.Infrastructure.csproj", "VinFastO2O.OrderService.Infrastructure/"]
COPY ["VinFastO2O.OrderService.Application/VinFastO2O.OrderService.Application.csproj", "VinFastO2O.OrderService.Application/"]
COPY ["VinFastO2O.OrderService.Domain/VinFastO2O.OrderService.Domain.csproj", "VinFastO2O.OrderService.Domain/"]

# Restore packages
RUN dotnet restore "VinFastO2O.OrderService.API/VinFastO2O.OrderService.API.csproj"

# Copy the remaining source files and compile
COPY . .
WORKDIR "/src/VinFastO2O.OrderService.API"
RUN dotnet build "VinFastO2O.OrderService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VinFastO2O.OrderService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final runtime environment
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VinFastO2O.OrderService.API.dll"]
