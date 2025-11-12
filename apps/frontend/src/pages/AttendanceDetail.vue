<template>
  <div class="attendance-detail">
    <div class="page-header">
      <el-button link @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2>员工考勤详情 - {{ employeeData.employee_name }}</h2>
      <div class="header-actions">
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 员工基本信息 -->
    <el-card class="info-card">
      <template #header>
        <span>员工信息</span>
      </template>
      <el-descriptions :column="3" border>
        <el-descriptions-item label="员工ID">{{ employeeData.employee_id }}</el-descriptions-item>
        <el-descriptions-item label="员工姓名">{{ employeeData.employee_name }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ employeeData.department_name }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 考勤统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-statistic title="出勤天数" :value="employeeData.statistics?.work_days" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="出勤率" :value="employeeData.statistics?.attendance_rate" suffix="%" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="迟到次数" :value="employeeData.statistics?.late_count" />
      </el-col>
      <el-col :span="6">
        <el-statistic title="加班时长" :value="employeeData.statistics?.overtime_hours" suffix="小时" />
      </el-col>
    </el-row>

    <!-- 考勤记录列表 -->
    <el-card class="records-card">
      <template #header>
        <div class="records-header">
          <span>考勤记录</span>
          <div class="date-filter">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              @change="handleDateChange"
            />
          </div>
        </div>
      </template>

      <el-table
        :data="filteredRecords"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="check_in_time" label="上班时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.check_in_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="check_out_time" label="下班时间" width="150">
          <template #default="{ row }">
            {{ formatTime(row.check_out_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="work_hours" label="工作时长" width="100">
          <template #default="{ row }">
            {{ row.work_hours }}小时
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { attendanceAPI } from '../api/attendance'

export default {
  name: 'AttendanceDetail',
  components: {
    ArrowLeft,
    Refresh
  },
  props: {
    employeeId: {
      type: [String, Number],
      required: true
    }
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    
    // 响应式数据
    const loading = ref(false)
    const dateRange = ref([])
    
    const employeeData = reactive({
      employee_id: 0,
      employee_name: '',
      department_name: '',
      attendance_records: [],
      statistics: {}
    })
    
    const pagination = reactive({
      current: 1,
      size: 10,
      total: 0
    })

    // 计算属性
    const filteredRecords = computed(() => {
      let records = [...employeeData.attendance_records]
      
      // 日期筛选
      if (dateRange.value && dateRange.value.length === 2) {
        const [startDate, endDate] = dateRange.value
        records = records.filter(record => 
          record.date >= startDate && record.date <= endDate
        )
      }
      
      // 分页
      const startIndex = (pagination.current - 1) * pagination.size
      const endIndex = startIndex + pagination.size
      pagination.total = records.length
      
      return records.slice(startIndex, endIndex)
    })

    // 方法
    const loadData = async () => {
      loading.value = true
      try {
        const response = await attendanceAPI.getEmployeeAttendanceDetail(props.employeeId)
        if (response.success) {
          Object.assign(employeeData, response.data)
        }
      } catch (error) {
        ElMessage.error('加载员工考勤详情失败')
        console.error('加载员工考勤详情失败:', error)
      } finally {
        loading.value = false
      }
    }

    const handleDateChange = () => {
      pagination.current = 1
    }

    const handleSizeChange = (size) => {
      pagination.size = size
      pagination.current = 1
    }

    const handleCurrentChange = (page) => {
      pagination.current = page
    }

    const refreshData = () => {
      loadData()
    }

    const formatTime = (time) => {
      if (!time) return '-'
      return new Date(time).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getStatusType = (status) => {
      const typeMap = {
        'present': 'success',
        'late': 'warning',
        'early_leave': 'warning',
        'absent': 'danger',
        'sick_leave': 'info',
        'annual_leave': 'info'
      }
      return typeMap[status] || 'info'
    }

    const getStatusText = (status) => {
      const textMap = {
        'present': '正常',
        'late': '迟到',
        'early_leave': '早退',
        'absent': '缺勤',
        'sick_leave': '病假',
        'annual_leave': '年假'
      }
      return textMap[status] || status
    }

    // 监听刷新事件
    const handleRefresh = () => {
      refreshData()
    }

    onMounted(() => {
      loadData()
      window.addEventListener('refresh-attendance-data', handleRefresh)
    })

    onUnmounted(() => {
      window.removeEventListener('refresh-attendance-data', handleRefresh)
    })

    return {
      loading,
      dateRange,
      employeeData,
      filteredRecords,
      pagination,
      handleDateChange,
      handleSizeChange,
      handleCurrentChange,
      refreshData,
      formatTime,
      getStatusType,
      getStatusText
    }
  }
}
</script>

<style scoped>
.attendance-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.info-card {
  margin-bottom: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.records-card {
  margin-bottom: 20px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>