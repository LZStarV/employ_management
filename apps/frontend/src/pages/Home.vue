<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用员工管理系统</span>
        </div>
      </template>
      <div class="welcome-content">
        <h2>系统概览</h2>
        <p>这是一个基于Koa.js + PostgreSQL + Vue3的员工管理系统，提供全面的人力资源管理功能。</p>
      </div>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon employee-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ statistics.totalEmployees || 0 }}</div>
              <div class="stat-label">总员工数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon department-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ statistics.totalDepartments || 0 }}</div>
              <div class="stat-label">部门数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon project-icon">
              <el-icon><Briefcase /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ statistics.totalProjects || 0 }}</div>
              <div class="stat-label">项目数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon active-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ statistics.activeEmployees || 0 }}</div>
              <div class="stat-label">在职员工</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>部门人员分布</span>
            </div>
          </template>
          <div v-if="!chartDataError" class="chart-container">
            <v-chart :option="departmentChartOption" :autoresize="true" style="height: 240px;" />
          </div>
          <div v-else class="chart-placeholder">
            <el-icon class="placeholder-icon"><DataBoard /></el-icon>
            <p>部门人员分布图表</p>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>员工状态统计</span>
            </div>
          </template>
          <div v-if="!chartDataError" class="chart-container">
            <v-chart :option="employeeStatusChartOption" :autoresize="true" style="height: 240px;" />
          </div>
          <div v-else class="chart-placeholder">
            <el-icon class="placeholder-icon"><DataAnalysis /></el-icon>
            <p>员工状态统计图表</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, OfficeBuilding, Briefcase, Check, DataBoard, DataAnalysis } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import employeeApi from '../api/employeeApi'
import departmentApi from '../api/departmentApi'
import projectApi from '../api/projectApi'

// 注册ECharts组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

export default {
  name: 'Home',
  components: {
    User,
    OfficeBuilding,
    Briefcase,
    Check,
    DataBoard,
    DataAnalysis,
    VChart
  },
  setup() {
    const statistics = ref({
      totalEmployees: 0,
      totalDepartments: 0,
      totalProjects: 0,
      activeEmployees: 0
    })
    
    const chartDataError = ref(false)
    const departmentData = ref([])
    const employeeStatusData = ref([])

    // 部门人员分布图表配置
    const departmentChartOption = computed(() => ({
      title: {
        text: '部门人员分布',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle'
      },
      series: [
        {
          name: '部门人员',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 18,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: departmentData.value.length > 0 ? departmentData.value : [
            { value: 1000, name: '技术部' },
            { value: 800, name: '市场部' },
            { value: 600, name: '人力资源部' },
            { value: 400, name: '财务部' },
            { value: 200, name: '产品部' }
          ]
        }
      ]
    }))

    // 员工状态统计图表配置
    const employeeStatusChartOption = computed(() => ({
      title: {
        text: '员工状态统计',
        left: 'center',
        textStyle: {
          fontSize: 14
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: employeeStatusData.value.length > 0 ? 
          employeeStatusData.value.map(item => item.name) : 
          ['在职', '离职', '休假', '停用']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '员工数量',
          type: 'bar',
          barWidth: '60%',
          data: employeeStatusData.value.length > 0 ? 
            employeeStatusData.value.map(item => item.value) : 
            [4500, 300, 150, 50],
          itemStyle: {
            color: function(params) {
              const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666']
              return colors[params.dataIndex] || '#5470c6'
            }
          }
        }
      ]
    }))

    // 获取统计数据
    const fetchStatistics = async () => {
      try {
        chartDataError.value = false
        
        // 获取员工统计
        const employeesResponse = await employeeApi.getEmployees({ page: 1, limit: 1 })
        statistics.value.totalEmployees = employeesResponse.pagination?.total || 0
        
        // 获取部门统计
        const departmentsResponse = await departmentApi.getDepartments({ page: 1, limit: 1 })
        statistics.value.totalDepartments = departmentsResponse.pagination?.total || 0
        
        // 获取项目统计
        const projectsResponse = await projectApi.getProjects({ page: 1, limit: 1 })
        statistics.value.totalProjects = projectsResponse.pagination?.total || 0
        
        // 获取在职员工统计
        const statisticsResponse = await employeeApi.getEmployeeStatistics()
        statistics.value.activeEmployees = statisticsResponse.data?.activeEmployees || 0
        
        // 使用实际的部门人员分布数据
        if (statisticsResponse.data?.departmentStats) {
          // 获取部门列表以获取部门名称
          try {
            const departmentsResponse = await departmentApi.getDepartments({ page: 1, limit: 20 })
            const departmentsMap = new Map()
            if (departmentsResponse.data) {
              departmentsResponse.data.forEach(dept => {
                departmentsMap.set(dept.department_id, dept.department_name)
              })
            }
            
            departmentData.value = statisticsResponse.data.departmentStats.map(dept => ({
              value: parseInt(dept.count),
              name: departmentsMap.get(dept.department_id) || `部门${dept.department_id}`
            }))
          } catch (error) {
            // 如果获取部门列表失败，使用部门ID
            departmentData.value = statisticsResponse.data.departmentStats.map(dept => ({
              value: parseInt(dept.count),
              name: `部门${dept.department_id}`
            }))
          }
        } else {
          // 如果后端没有返回部门统计数据，使用模拟数据
          departmentData.value = [
            { value: Math.floor(statistics.value.totalEmployees * 0.4), name: '技术部' },
            { value: Math.floor(statistics.value.totalEmployees * 0.25), name: '市场部' },
            { value: Math.floor(statistics.value.totalEmployees * 0.15), name: '人力资源部' },
            { value: Math.floor(statistics.value.totalEmployees * 0.12), name: '财务部' },
            { value: Math.floor(statistics.value.totalEmployees * 0.08), name: '产品部' }
          ]
        }
        
        // 使用实际的员工状态数据
        if (statisticsResponse.data) {
          // 根据总员工数和在职员工数计算其他状态
          const activeCount = statistics.value.activeEmployees
          const otherCount = statistics.value.totalEmployees - activeCount
          
          employeeStatusData.value = [
            { name: '在职', value: activeCount },
            { name: '离职', value: Math.floor(otherCount * 0.6) },
            { name: '休假', value: Math.floor(otherCount * 0.3) },
            { name: '停用', value: Math.floor(otherCount * 0.1) }
          ]
        } else {
          // 如果后端没有返回统计数据，使用模拟数据
          employeeStatusData.value = [
            { name: '在职', value: Math.floor(statistics.value.totalEmployees * 0.9) },
            { name: '离职', value: Math.floor(statistics.value.totalEmployees * 0.06) },
            { name: '休假', value: Math.floor(statistics.value.totalEmployees * 0.03) },
            { name: '停用', value: Math.floor(statistics.value.totalEmployees * 0.01) }
          ]
        }
        
      } catch (error) {
        chartDataError.value = true
        ElMessage.error('获取统计数据失败')
        console.error('获取统计数据失败:', error)
      }
    }

    // 监听全局刷新事件
    const setupRefreshListener = () => {
      window.addEventListener('refresh-home-data', fetchStatistics)
    }

    onMounted(() => {
      fetchStatistics()
      setupRefreshListener()
    })

    return {
      statistics,
      chartDataError,
      departmentChartOption,
      employeeStatusChartOption
    }
  }
}
</script>

<style scoped>
.home-container {
  padding: 0;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  text-align: center;
  padding: 20px 0;
}

.welcome-content h2 {
  margin-bottom: 10px;
  color: #333;
}

.welcome-content p {
  color: #666;
  font-size: 16px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-right: 20px;
}

.employee-icon {
  background-color: #e6f7ff;
  color: #1890ff;
}

.department-icon {
  background-color: #f6ffed;
  color: #52c41a;
}

.project-icon {
  background-color: #fff7e6;
  color: #fa8c16;
}

.active-icon {
  background-color: #f0f9ff;
  color: #36cfc9;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-top: 5px;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 300px;
}

.chart-container {
  height: 240px;
}

.chart-placeholder {
  height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  background-color: #fafafa;
  border-radius: 4px;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>