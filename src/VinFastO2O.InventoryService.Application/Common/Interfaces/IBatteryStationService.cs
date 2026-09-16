using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using VinFastO2O.InventoryService.Application.DTOs;

namespace VinFastO2O.InventoryService.Application.Common.Interfaces;

public interface IBatteryStationService
{
    Task<IEnumerable<BatteryStationMonitoringDto>> GetRealtimeStationStatusAsync(CancellationToken cancellationToken = default);
}
